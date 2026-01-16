import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAWI81lV2b6qrm_mQh1HmNe5iu07h491mM",
  authDomain: "nutrify-8b60d.firebaseapp.com",
  projectId: "nutrify-8b60d",
  storageBucket: "nutrify-8b60d.firebasestorage.app",
  messagingSenderId: "776638956026",
  appId: "1:776638956026:android:8caa5ff66e91238093a443"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;
let userGoals = { calories: 2000, protein: 0, fats: 0, fiber: 0 }; 
const APP_ID = "9177cc1c";
const APP_KEY = "9f153da4b14fc9ebdbbe7ff9c3d5e699";
let baseNutrientsPer100g = null;

onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  if (user) {
    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);
    
    const goalRef = doc(db, "userGoals", user.uid);
    const goalSnap = await getDoc(goalRef);
    if (goalSnap.exists()) {
      userGoals = goalSnap.data();
    }

    if (docSnap.exists()) {
      const userData = docSnap.data();
      document.getElementById('userNameDisplay').innerText = userData.firstName || "User";
      updateHomeProgressBar(userData.diaryLogs || []);
      renderCustomLibrary(userData.customFoods || []); 
    } else {
      window.location.href = "index.html";
    }
  }
});

function updateHomeProgressBar(logs) {
    const today = new Date().toISOString().split('T')[0];
    const todayLogs = logs.filter(log => log.date === today);

    let totals = { cal: 0, pro: 0, carb: 0, fat: 0, fib: 0 };
    todayLogs.forEach(log => {
        totals.cal += parseFloat(log.calories) || 0;
        totals.pro += parseFloat(log.protein) || 0;
        totals.carb += parseFloat(log.carbs) || 0; 
        totals.fat += parseFloat(log.fats) || 0;
        totals.fib += parseFloat(log.fiber) || 0;
    });

    document.getElementById('daily-cal-used').innerText = Math.round(totals.cal);
    document.getElementById('daily-cal-goal').innerText = Math.round(userGoals.calories);
    document.getElementById('daily-pro').innerText = totals.pro.toFixed(1) + 'g';
    document.getElementById('daily-carb').innerText = totals.carb.toFixed(1) + 'g';
    document.getElementById('daily-fat').innerText = totals.fat.toFixed(1) + 'g';
    document.getElementById('daily-fib').innerText = totals.fib.toFixed(1) + 'g';

    const pct = Math.min((totals.cal / userGoals.calories) * 100, 100);
    const bar = document.getElementById('daily-cal-bar');
    if (bar) {
        bar.style.width = pct + "%";
        totals.cal > userGoals.calories ? bar.classList.add('over-limit') : bar.classList.remove('over-limit');
    }
}

function renderCustomLibrary(customFoods) {
    const libraryContainer = document.getElementById('customFoodLibrary');
    if (!libraryContainer) return;

    if (!customFoods || customFoods.length === 0) {
        libraryContainer.innerHTML = '<p class="empty-msg">No custom foods created yet.</p>';
        return;
    }

    libraryContainer.innerHTML = customFoods.map(food => `
        <div class="library-item" data-food='${JSON.stringify(food)}'>
            <button class="delete-food-btn" title="Delete">&times;</button>
            <h4>${food.name}</h4>
            <span>${food.calories} kcal</span>
        </div>
    `).join('');

    document.querySelectorAll('.library-item').forEach(item => {
        item.onclick = (e) => {
            if (e.target.classList.contains('delete-food-btn')) {
                const foodData = JSON.parse(item.getAttribute('data-food'));
                deleteCustomFood(foodData);
                return;
            }
            const foodData = JSON.parse(item.getAttribute('data-food'));
            quickLogFood(foodData);
        };
    });
}

async function deleteCustomFood(food) {
    if (!currentUser || !confirm(`Delete "${food.name}" from library?`)) return;
    try {
        const userRef = doc(db, "users", currentUser.uid);
        await updateDoc(userRef, { customFoods: arrayRemove(food) });
        
        const updatedSnap = await getDoc(userRef);
        renderCustomLibrary(updatedSnap.data().customFoods || []);
    } catch (e) { console.error("Error deleting food:", e); }
}

async function quickLogFood(food) {
    if (!currentUser) return;
    const newEntry = {
        ...food,
        timestamp: Date.now(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toISOString().split('T')[0]
    };
    try {
        const userRef = doc(db, "users", currentUser.uid);
        await updateDoc(userRef, { diaryLogs: arrayUnion(newEntry) });
        const updatedSnap = await getDoc(userRef);
        updateHomeProgressBar(updatedSnap.data().diaryLogs || []);
        alert(`${food.name} added to today!`);
    } catch (e) { console.error("Error quick-logging:", e); }
}

async function searchFood(query) {
  if (!query) return;
  const url = `https://api.edamam.com/api/food-database/v2/parser?app_id=${APP_ID}&app_key=${APP_KEY}&ingr=${encodeURIComponent(query)}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    const resultsContainer = document.querySelector('.results-container');

    if (data.hints && data.hints.length > 0) {
      const food = data.hints[0].food;
      baseNutrientsPer100g = {
        name: food.label,
        calories: food.nutrients.ENERC_KCAL || 0,
        protein: food.nutrients.PROCNT || 0,
        carbs: food.nutrients.CHOCDF || 0,
        fats: food.nutrients.FAT || 0,
        fiber: food.nutrients.FIBTG || 0
      };
      if(resultsContainer) resultsContainer.style.display = 'block';
      updateByWeight(100);
    } else { 
      alert('No food found.'); 
      if(resultsContainer) resultsContainer.style.display = 'none';
    }
  } catch (error) { 
    console.error(error); 
  }
}

function loadCustomFoodToUI(food) {
    baseNutrientsPer100g = {
        name: food.name,
        calories: food.calories,
        protein: parseFloat(food.protein) || 0,
        carbs: parseFloat(food.carbs) || 0,
        fats: parseFloat(food.fats) || 0,
        fiber: parseFloat(food.fiber) || 0
    };
    const resultsContainer = document.querySelector('.results-container');
    if(resultsContainer) {
        resultsContainer.style.display = 'block';
        resultsContainer.scrollIntoView({ behavior: 'smooth' });
    }
    updateByWeight(100); 
}

function updateByWeight(grams) {
  if (!baseNutrientsPer100g) return;
  const factor = grams / 100;
  document.getElementById('foodName').innerText = baseNutrientsPer100g.name;
  document.getElementById('calories').innerText = Math.round(baseNutrientsPer100g.calories * factor);
  const values = document.querySelectorAll('.macro-item .value');
  values[0].innerText = (baseNutrientsPer100g.protein * factor).toFixed(1) + 'g';
  values[1].innerText = (baseNutrientsPer100g.carbs * factor).toFixed(1) + 'g';
  values[2].innerText = (baseNutrientsPer100g.fats * factor).toFixed(1) + 'g';
  document.getElementById('fiberValue').innerText = (baseNutrientsPer100g.fiber * factor).toFixed(1) + 'g';
}

document.addEventListener('DOMContentLoaded', () => {
  // --- NEW: CLEAN MOBILE MENU TOGGLE LOGIC ---
  const menuToggle = document.getElementById('mobile-menu');
  const navLinks = document.getElementById('nav-list');

  if (menuToggle && navLinks) {
      menuToggle.onclick = () => {
          navLinks.classList.toggle('active');
          menuToggle.classList.toggle('is-active'); 
      };
  }

  // Close menu when clicking any link
  document.querySelectorAll('.nav-links a').forEach(link => {
      link.addEventListener('click', () => {
          navLinks.classList.remove('active');
          menuToggle.classList.remove('is-active');
      });
  });

  // --- MODAL & SEARCH LOGIC ---
  const modal = document.getElementById('createFoodModal');
  const openBtn = document.getElementById('openCreateModal');
  const closeBtn = document.querySelector('.close-modal');
  const customForm = document.getElementById('customFoodForm');

  if(openBtn) openBtn.onclick = () => modal.style.display = "block";
  if(closeBtn) closeBtn.onclick = () => modal.style.display = "none";

  if(customForm) {
      customForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          if(!currentUser) return;

          const customFood = {
              name: document.getElementById('customName').value,
              weight: document.getElementById('customWeight').value + "g",
              calories: parseInt(document.getElementById('customCal').value),
              protein: document.getElementById('customPro').value || "0",
              carbs: document.getElementById('customCarb').value || "0",
              fats: document.getElementById('customFat').value || "0",
              fiber: document.getElementById('customFib').value || "0",
              isCustom: true
          };

          const logEntry = {
              ...customFood,
              timestamp: Date.now(),
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              date: new Date().toISOString().split('T')[0]
          };

          try {
              const userRef = doc(db, "users", currentUser.uid);
              await updateDoc(userRef, { 
                  customFoods: arrayUnion(customFood),
                  diaryLogs: arrayUnion(logEntry) 
              });
              
              const updatedSnap = await getDoc(userRef);
              const data = updatedSnap.data();
              updateHomeProgressBar(data.diaryLogs || []);
              renderCustomLibrary(data.customFoods || []);
              
              modal.style.display = "none";
              customForm.reset();
              alert("Custom food saved to library!");
          } catch (err) { console.error(err); }
      });
  }

  const searchBtn = document.getElementById('searchBtn');
  const foodInput = document.getElementById('foodInput');
  const suggestionsBox = document.getElementById('suggestionsBox');
  const weightInput = document.getElementById('foodWeight');

  if (searchBtn) searchBtn.onclick = () => searchFood(foodInput.value.trim());
  if (weightInput) weightInput.oninput = (e) => updateByWeight(e.target.value || 0);
  
  if (foodInput) {
      foodInput.oninput = async (e) => {
          const query = e.target.value.trim().toLowerCase();
          if (query.length < 1) {
              suggestionsBox.style.display = 'none';
              return;
          }

          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          const customFoods = userDoc.data()?.customFoods || [];
          const localMatches = customFoods.filter(f => f.name.toLowerCase().includes(query));

          let apiSuggestions = [];
          if (query.length >= 2) {
              const res = await fetch(`https://api.edamam.com/auto-complete?app_id=${APP_ID}&app_key=${APP_KEY}&q=${encodeURIComponent(query)}`);
              apiSuggestions = await res.json();
          }

          if (localMatches.length > 0 || apiSuggestions.length > 0) {
              let html = '';
              localMatches.forEach(food => {
                  html += `<div class="suggestion-item" data-type="custom" data-food='${JSON.stringify(food)}' style="border-left: 4px solid #2ecc71; background: (49, 48, 48);">
                              ⭐ ${food.name} (My Food)
                           </div>`;
              });
              apiSuggestions.forEach(item => {
                  html += `<div class="suggestion-item" data-type="api">${item}</div>`;
              });
              suggestionsBox.innerHTML = html;
              suggestionsBox.style.display = 'block';
          } else {
              suggestionsBox.style.display = 'none';
          }
      };
  }

  if (suggestionsBox) {
      suggestionsBox.onclick = (e) => {
          const item = e.target.closest('.suggestion-item');
          if (!item) return;
          const type = item.getAttribute('data-type');
          if (type === 'custom') {
              const foodData = JSON.parse(item.getAttribute('data-food'));
              loadCustomFoodToUI(foodData);
              foodInput.value = foodData.name;
          } else {
              foodInput.value = item.innerText;
              searchFood(foodInput.value);
          }
          suggestionsBox.style.display = 'none';
      };
  }

  const addBtn = document.querySelector('.btn-add-global');
  if (addBtn) {
    addBtn.addEventListener('click', async () => {
      if (!baseNutrientsPer100g || !currentUser) return alert("Search for food first.");
      const values = document.querySelectorAll('.macro-item .value');
      const logEntry = {
        name: baseNutrientsPer100g.name,
        weight: document.getElementById('foodWeight').value + "g",
        calories: parseInt(document.getElementById('calories').innerText),
        protein: values[0].innerText.replace('g',''),
        carbs: values[1].innerText.replace('g',''),
        fats: values[2].innerText.replace('g',''),
        fiber: document.getElementById('fiberValue').innerText.replace('g',''),
        timestamp: Date.now(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toISOString().split('T')[0]
      };
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, { diaryLogs: arrayUnion(logEntry) });
      const snap = await getDoc(userRef);
      updateHomeProgressBar(snap.data().diaryLogs || []);
      alert("Added!");
    });
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
      logoutBtn.onclick = () => {
          signOut(auth).then(() => window.location.href="index.html");
      };
  }
});

