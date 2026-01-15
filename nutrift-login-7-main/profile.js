import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAWI81lV2b6qrm_mQh1HmNe5iu07h491mM", //
    authDomain: "nutrify-8b60d.firebaseapp.com",
    projectId: "nutrify-8b60d",
    storageBucket: "nutrify-8b60d.firebasestorage.app",
    messagingSenderId: "776638956026",
    appId: "1:776638956026:android:8caa5ff66e91238093a443"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const saveBtn = document.getElementById('saveProfileBtn');
const messageDiv = document.getElementById('message');

// ... existing imports and configuration ...

saveBtn.addEventListener('click', async () => {
    const user = auth.currentUser;
    if (!user) {
        messageDiv.className = "error-msg";
        messageDiv.innerText = "You must be logged in.";
        return;
    }

    const profileData = {
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        age: document.getElementById('age').value,
        gender: document.getElementById('gender').value,
        height: document.getElementById('height').value,
        weight: document.getElementById('weight').value,
        updatedAt: new Date()
    };

    try {
        await setDoc(doc(db, "users", user.uid), profileData);
        messageDiv.className = "success-msg";
        messageDiv.innerText = "Profile saved successfully!";
        
        // REDIRECT UPDATED HERE:
        setTimeout(() => { 
            window.location.href = "goal.html"; // Changed from dashboard.html
        }, 1000);

    } catch (error) {
        messageDiv.className = "error-msg";
        messageDiv.innerText = "Error saving profile: " + error.message;
    }
});