import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

// 1. Check Auth & Pre-fill existing data
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            document.getElementById('updateAge').value = data.age || "";
            document.getElementById('updateHeight').value = data.height || "";
            document.getElementById('updateWeight').value = data.weight || "";
        }
    } else {
        window.location.href = "index.html";
    }
});

// 2. Handle the Update
document.getElementById('updateProfileForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const newAge = document.getElementById('updateAge').value;
    const newHeight = document.getElementById('updateHeight').value;
    const newWeight = document.getElementById('updateWeight').value;

    const userRef = doc(db, "users", currentUser.uid);

    try {
        // updateDoc only modifies the keys provided
        await updateDoc(userRef, {
            age: newAge,
            height: newHeight,
            weight: newWeight
        });

        alert("Profile updated successfully!");
        window.location.href = "dashboard.html";
    } catch (error) {
        console.error("Error updating profile:", error);
        alert("Failed to update profile.");
    }
});