import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Firebase configuration
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

let profileData = null;
let calculatedPlan = null;

// UI Elements
const userNameDisplay = document.getElementById("userNameDisplay");
const currentWeightInput = document.getElementById("currentWeight");
const goalWeightInput = document.getElementById("goalWeight");
const goalDaysInput = document.getElementById("goalDays");
const goalTypeSelect = document.getElementById("goalType");
const calcGoalBtn = document.getElementById("calcGoalBtn");
const saveGoalBtn = document.getElementById("saveGoalBtn");
const goalResultsSection = document.getElementById("goalResultsSection");
const goalCaloriesEl = document.getElementById("goalCalories");
const goalProteinEl = document.getElementById("goalProtein");
const goalFatsEl = document.getElementById("goalFats");
const goalFiberEl = document.getElementById("goalFiber");
const goalNoteEl = document.getElementById("goalNote");

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  try {
    const docRef = doc(db, "users", user.uid);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      profileData = snap.data();
      if (userNameDisplay) userNameDisplay.innerText = profileData.firstName || "User";
      if (currentWeightInput) currentWeightInput.value = profileData.weight || "";
    }
  } catch (err) {
    console.error("Error loading profile:", err);
  }
});

function calcMaintenance(activityMultiplier = 1.2) {
  if (!profileData) return null;
  const weight = parseFloat(profileData.weight);
  const height = parseFloat(profileData.height);
  const age = parseInt(profileData.age, 10) || 25;
  const gender = (profileData.gender || "male").toLowerCase();
  
  let bmr = (gender === "female")
    ? (10 * weight + 6.25 * height - 5 * age - 161)
    : (10 * weight + 6.25 * height - 5 * age + 5);
    
  return Math.round(bmr * activityMultiplier);
}

function updateGoalDisplay(cals, p, f, fi, note) {
  if (goalCaloriesEl) goalCaloriesEl.innerText = `${Math.round(cals)} kcal/day`;
  if (goalProteinEl) goalProteinEl.innerText = `${Math.round(p)} g`;
  if (goalFatsEl) goalFatsEl.innerText = `${Math.round(f)} g`;
  if (goalFiberEl) goalFiberEl.innerText = `${Math.round(fi)} g`;
  if (goalNoteEl) goalNoteEl.innerText = note || "";
}

if (calcGoalBtn) {
  calcGoalBtn.addEventListener("click", () => {
    if (!profileData) {
      alert("Please complete your profile first.");
      return;
    }

    const currentWeight = parseFloat(profileData.weight);
    const targetWeight = parseFloat(goalWeightInput.value);
    const days = parseInt(goalDaysInput.value, 10);
    const type = goalTypeSelect.value;

    if (isNaN(targetWeight) || isNaN(days) || days <= 0) {
      alert("Please enter a valid target weight and number of days.");
      return;
    }

    const totalWeightChange = targetWeight - currentWeight;
    const dailyDelta = (totalWeightChange * 7700) / days;
    
    let activityMultiplier = 1.2;
    let proteinMultiplier = 1.6;

    if (type === "muscle") {
      activityMultiplier = 1.55; 
      proteinMultiplier = 2.2;
    } else if (type === "lose") {
      proteinMultiplier = 2.0;
    }

    const maintenance = calcMaintenance(activityMultiplier);
    let goalCalories = maintenance + dailyDelta;

    // Safety limits
    goalCalories = Math.max(1200, Math.min(goalCalories, 5000));
    const protein = currentWeight * proteinMultiplier;
    const fats = (0.25 * goalCalories) / 9;
    const fiber = currentWeight * 0.35;

    calculatedPlan = {
      uid: auth.currentUser.uid,
      calories: Math.round(goalCalories),
      protein: Math.round(protein),
      fats: Math.round(fats),
      fiber: Math.round(fiber),
      goalType: type,
      targetWeight: targetWeight,
      durationDays: days,
      dateSet: new Date().toISOString()
    };

    updateGoalDisplay(goalCalories, protein, fats, fiber, `Goal: Reach ${targetWeight}kg in ${days} days.`);
    
    // SHOW results
    if (goalResultsSection) goalResultsSection.style.display = "block";
    if (saveGoalBtn) {
      saveGoalBtn.style.display = "block";
      saveGoalBtn.innerText = "Save Goal to Profile";
      saveGoalBtn.disabled = false;
    }
  });
}

// Updated Save with Redirect
if (saveGoalBtn) {
  saveGoalBtn.addEventListener("click", async () => {
    if (!auth.currentUser || !calculatedPlan) return;
    try {
      const goalRef = doc(db, "userGoals", auth.currentUser.uid);
      const snap = await getDoc(goalRef);
      
      if (snap.exists()) {
        const confirmUpdate = confirm("You already have a saved goal. Update it?");
        if (!confirmUpdate) return;
      }

      await setDoc(goalRef, calculatedPlan);
      alert("Plan saved successfully! Redirecting to your home");
      
      // Redirect to dashboard or home page
      window.location.href = "home.html"; 
    } catch (err) {
      console.error("Save error:", err);
      alert("Error saving your goal.");
    }
  });
}

// Mobile Menu
const menuToggle = document.getElementById('mobile-menu');
const navList = document.getElementById('nav-list');

if (menuToggle && navList) {
    menuToggle.addEventListener('click', () => {
        menuToggle.classList.toggle('active');
        navList.classList.toggle('active');
    });
}


// UI Elements - Add this to your existing list
const skipBtn = document.getElementById("skipBtn");

// Add this event listener at the bottom of your script
if (skipBtn) {
  skipBtn.addEventListener("click", () => {
    window.location.href = "home.html";
  });
}