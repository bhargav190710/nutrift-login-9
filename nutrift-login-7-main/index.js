import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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

const loginBtn = document.getElementById('loginBtn');
const messageDiv = document.getElementById('message');

loginBtn.addEventListener('click', () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            messageDiv.className = "success-msg";
            messageDiv.innerText = "Login successful! Redirecting...";
            
            setTimeout(() => {
                window.location.href = "home.html"; 
            }, 1000);
        })
        .catch((error) => {
            messageDiv.className = "error-msg";
            messageDiv.innerText = "Error: " + error.message;
        });
});