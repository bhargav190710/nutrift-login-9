import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Firebase Configuration
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

onAuthStateChanged(auth, async (user) => {
    if (user) {
        try {
            // 1. Fetch User Profile Data
            const profileRef = doc(db, "users", user.uid);
            const profileSnap = await getDoc(profileRef);

            if (profileSnap.exists()) {
                const data = profileSnap.data();
                
                // Populate Basic Profile UI
                document.getElementById('welcomeName').innerText = `${data.firstName} ${data.lastName}`;
                document.getElementById('userEmail').innerText = user.email;
                document.getElementById('displayAge').innerText = data.age || "N/A";
                document.getElementById('displayGender').innerText = data.gender || "N/A";
                document.getElementById('displayHeight').innerText = data.height || "--";
                document.getElementById('displayWeight').innerText = data.weight || "--";

                // 2. Calculate Maintenance Requirements
                const weight = parseFloat(data.weight);
                const height = parseFloat(data.height);
                const age = parseInt(data.age);
                const gender = data.gender?.toLowerCase();

                if (weight && height && age && gender) {
                    // Mifflin-St Jeor Equation
                    let bmr = (gender === "female")
                        ? (10 * weight + 6.25 * height - 5 * age - 161)
                        : (10 * weight + 6.25 * height - 5 * age + 5);
                    
                    // Maintenance Calories (Sedentary multiplier 1.2)
                    const maintenance = Math.round(bmr * 1.2);
                    
                    // Standard Maintenance Macros
                    const carbs = Math.round((maintenance * 0.50) / 4);
                    const protein = Math.round((maintenance * 0.25) / 4);
                    const fats = Math.round((maintenance * 0.25) / 9);
                    const water = (weight * 0.035).toFixed(1);

                    // Update Maintenance UI
                    if(document.getElementById('displayMaintenance')) 
                        document.getElementById('displayMaintenance').innerText = maintenance;
                    
                    document.getElementById('displayCalories').innerText = maintenance;
                    document.getElementById('displayCarbs').innerText = carbs;
                    document.getElementById('displayProtein').innerText = protein;
                    document.getElementById('displayFats').innerText = fats;
                    document.getElementById('displayWater').innerText = water;
                }

                // 3. Fetch Saved Goal from userGoals Collection
                const goalRef = doc(db, "userGoals", user.uid);
                const goalSnap = await getDoc(goalRef);

                if (goalSnap.exists()) {
                    const goalData = goalSnap.data();
                    
                    // Reveal the Saved Goal section
                    const goalSection = document.getElementById('savedGoalSection');
                    if (goalSection) goalSection.style.display = 'block';
                    
                    // Populate Goal-specific values
                    if (document.getElementById('dashGoalCalories')) 
                        document.getElementById('dashGoalCalories').innerText = goalData.calories;
                    if (document.getElementById('dashGoalProtein')) 
                        document.getElementById('dashGoalProtein').innerText = goalData.protein;
                    if (document.getElementById('dashGoalFats')) 
                        document.getElementById('dashGoalFats').innerText = goalData.fats;
                    if (document.getElementById('dashGoalFiber')) 
                        document.getElementById('dashGoalFiber').innerText = goalData.fiber;
                    if (document.getElementById('dashGoalCarbs')) 
                        document.getElementById('dashGoalCarbs').innerText = goalData.carbs;
                    
                    // Display Goal Description
                    if (document.getElementById('dashboardGoalNote')) {
                        document.getElementById('dashboardGoalNote').innerText = 
                            `Goal: Reach ${goalData.targetWeight}kg in ${goalData.durationDays} days (${goalData.goalType})`;
                    }
                }

            } else {
                // No profile found, redirect to complete profile
                window.location.href = "profile.html";
            }
        } catch (error) {
            console.error("Error loading dashboard data:", error);
        }
    } else {
        // No user is signed in, redirect to login
        window.location.href = "index.html";
    }
});

// Logout functionality
document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    signOut(auth).then(() => {
        window.location.href = "index.html";
    });
});

/// --- UPDATED: MOBILE MENU TOGGLE LOGIC (Matched to Home) ---
document.addEventListener('DOMContentLoaded', () => {
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
            if (navLinks && menuToggle) {
                navLinks.classList.remove('active');
                menuToggle.classList.remove('is-active');
            }
        });
    });
});

onAuthStateChanged(auth, async (user) => {
    if (user) { 
        // Display user's name like home.js
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            document.getElementById('userNameDisplay').innerText = docSnap.data().firstName || "User";
        }
        
        fetchDiaryAndGoals(user.uid); 
    } 
    else { window.location.href = "index.html"; }
});