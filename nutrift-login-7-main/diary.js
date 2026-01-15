import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc, arrayRemove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

let allLogs = [];

onAuthStateChanged(auth, (user) => {
    if (user) { fetchDiaryAndGoals(user.uid); } 
    else { window.location.href = "index.html"; }
});

async function fetchDiaryAndGoals(uid) {
    try {
        const userSnap = await getDoc(doc(db, "users", uid));
        const goalSnap = await getDoc(doc(db, "userGoals", uid));

        if (userSnap.exists()) {
            allLogs = userSnap.data().diaryLogs || [];
            allLogs.sort((a, b) => b.timestamp - a.timestamp);
            
            const today = new Date().toISOString().split('T')[0];
            const todayArr = allLogs.filter(l => l.date === today);
            const historyArr = allLogs.filter(l => l.date !== today);

            renderSection('todayLogs', todayArr, false);
            renderSection('historyWrapper', historyArr, true);
            
            const totals = calculateTotals(todayArr);
            
            if (goalSnap.exists()) {
                updateGoalDashboard(totals, goalSnap.data());
            }
        }
    } catch (e) { console.error(e); }
}

function updateGoalDashboard(current, target) {
    document.getElementById('goalDashboard').style.display = 'grid';

    const nutrients = [
        { id: 'cal', cur: current.cal, goal: target.calories, unit: 'kcal' },
        { id: 'pro', cur: current.p, goal: target.protein, unit: 'g' },
        { id: 'fat', cur: current.f, goal: target.fats, unit: 'g' },
        { id: 'fib', cur: current.fib, goal: target.fiber, unit: 'g' }
    ];

    nutrients.forEach(n => {
        const pct = Math.min((n.cur / n.goal) * 100, 100);
        const bar = document.getElementById(`bar-${n.id}`);
        bar.style.width = pct + "%";
        
        // Calories get red if over limit, others stay green/blue
        if (n.id === 'cal' && n.cur > n.goal) bar.classList.add('over-limit');
        else bar.classList.remove('over-limit');

        document.getElementById(`label-${n.id}`).innerText = `${Math.round(n.cur)} / ${Math.round(n.goal)}${n.unit}`;
    });

    const calDiff = target.calories - current.cal;
    document.getElementById('hint-cal').innerText = calDiff > 0 
        ? `${Math.round(calDiff)} kcal remaining for today.` 
        : `You are ${Math.round(Math.abs(calDiff))} kcal over your limit.`;
}

function calculateTotals(logs) {
    let totals = { cal: 0, p: 0, f: 0, fib: 0 };
    logs.forEach(l => {
        totals.cal += l.calories;
        totals.p += parseFloat(l.protein) || 0;
        totals.f += parseFloat(l.fats) || 0;
        totals.fib += parseFloat(l.fiber) || 0;
    });
    document.getElementById('totalCals').innerText = Math.round(totals.cal);
    document.getElementById('totalProtein').innerText = totals.p.toFixed(1) + 'g';
    document.getElementById('totalFats').innerText = totals.f.toFixed(1) + 'g';
    document.getElementById('totalFiber').innerText = totals.fib.toFixed(1) + 'g';
    return totals;
}

function renderSection(containerId, logs, showHeaders) {
    const container = document.getElementById(containerId);
    container.innerHTML = logs.length ? '' : '<p style="color:#999; padding:10px;">No entries.</p>';
    
    let lastDate = "";
    logs.forEach(log => {
        if (showHeaders && log.date !== lastDate) {
            const h = document.createElement('h3');
            h.className = 'date-header';
            h.innerText = log.date;
            container.appendChild(h);
            lastDate = log.date;
        }
        container.appendChild(createLogElement(log));
    });
}

function createLogElement(log) {
    const div = document.createElement('div');
    div.className = 'log-entry';
    div.innerHTML = `
        <div class="log-info">
            <h3 style="font-size:1rem;">${log.name}</h3>
            <p style="font-size:0.8rem; color:#777;">${log.weight} • ${log.time}</p>
        </div>
        <div class="log-actions">
            <div style="text-align:right">
                <div style="font-weight:600; color:#4CAF50">${log.calories} kcal</div>
                <div style="font-size:0.7rem; color:#999;">P:${log.protein} F:${log.fats} Fib:${log.fiber}</div>
            </div>
            <button class="btn-delete">✕</button>
        </div>`;

    div.querySelector('.btn-delete').onclick = async () => {
        if (confirm(`Remove "${log.name}"?`)) {
            await updateDoc(doc(db, "users", auth.currentUser.uid), { diaryLogs: arrayRemove(log) });
            fetchDiaryAndGoals(auth.currentUser.uid);
        }
    };
    return div;
}

// History & Filter Controls
document.getElementById('toggleHistory').onclick = function() {
    const hw = document.getElementById('historyWrapper');
    const fs = document.getElementById('filterSection');
    const isHidden = hw.style.display !== "block";
    hw.style.display = isHidden ? "block" : "none";
    fs.style.display = isHidden ? "flex" : "none";
    this.innerText = isHidden ? "Hide History" : "View History";
};

document.getElementById('dateFilter').oninput = function(e) {
    const selected = e.target.value;
    const historyWrapper = document.getElementById('historyWrapper');
    if (!selected) {
        fetchDiaryAndGoals(auth.currentUser.uid);
        return;
    }
    const filtered = allLogs.filter(l => l.date === selected);
    historyWrapper.innerHTML = `<h3 class="date-header">Logs for ${selected}</h3>`;
    if (filtered.length === 0) {
        historyWrapper.innerHTML += '<p style="padding:10px; color:#999;">No data found.</p>';
    } else {
        filtered.forEach(log => historyWrapper.appendChild(createLogElement(log)));
    }
};

document.getElementById('logoutBtn').onclick = () => signOut(auth).then(() => window.location.href="index.html");

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

// Mobile Menu Toggle Logic
const menuToggle = document.getElementById('mobile-menu');
const navLinks = document.getElementById('nav-list');

if (menuToggle && navLinks) {
    menuToggle.onclick = () => {
        navLinks.classList.toggle('active');
        menuToggle.classList.toggle('is-active'); 
    };
}

// Logout Functionality
document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    signOut(auth).then(() => {
        window.location.href = "index.html";
    });
});