/* ============================
   CONFIG JSONBIN
============================ */
const BIN_ID = "691f68a643b1c97be9ba2e99";
const MASTER_KEY = "$2a$10$KrLTFFfXVPw7N28E4PRUSua4DvOOoRT.snirM.KMgCZBH/jVSqapS";

const API_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

/* ============================
   VARIABLES GLOBALES
============================ */
let data = { users: [], messages: [] };
let currentUser = null;

/* ============================
   JSONBIN: CHARGER / SAUVEGARDER
============================ */
async function loadDB() {
    try {
        const res = await fetch(API_URL + "/latest", {
            headers: { "X-Master-Key": MASTER_KEY }
        });
        const json = await res.json();
        data = json.record || { users: [], messages: [] };
        console.log("DB chargée :", data);
    } catch (err) {
        console.error("Erreur loadDB", err);
        data = { users: [], messages: [] };
    }
}

async function saveDB() {
    try {
        await fetch(API_URL, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "X-Master-Key": MASTER_KEY
            },
            body: JSON.stringify(data)
        });
        console.log("DB sauvegardée !");
    } catch (err) {
        console.error("Erreur saveDB", err);
    }
}

/* ============================
   UTILITAIRE: CHANGER D'ÉCRAN
============================ */
function showScreen(screenId) {
    document.querySelectorAll(".screen").forEach(s => s.style.display = "none");
    document.getElementById(screenId).style.display = "block";
}

/* ============================
   AVATARS
============================ */
function renderAvatarSelection(containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = "";
    for (let i = 1; i <= 6; i++) {
        const img = document.createElement("img");
        img.src = `avatar${i}.png`;
        img.className = "avatar";

        img.addEventListener("click", () => {
            [...container.children].forEach(c => c.classList.remove("selected-avatar"));
            img.classList.add("selected-avatar");
        });

        container.appendChild(img);
    }
}

/* ============================
   CENTRES D'INTÉRÊTS
============================ */
const INTERESTS = ["Sport", "Musique", "Danse", "Mode", "Jeux Vidéo", "Lecture", "Voyages"];

function renderInterests(containerId) {
    const cont = document.getElementById(containerId);
    cont.innerHTML = "";

    INTERESTS.forEach(interest => {
        const btn = document.createElement("button");
        btn.className = "interest-btn";
        btn.innerText = interest;

        btn.addEventListener("click", () => {
            btn.classList.toggle("selected-interest");
        });

        cont.appendChild(btn);
    });
}

/* ============================
   CRÉATION DE COMPTE
============================ */
async function createProfile() {
    await loadDB(); // rafraîchir la DB

    const name = document.getElementById("name").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!name || !password) {
        alert("Complète tout !");
        return;
    }

    if (data.users.some(u => u.name.toLowerCase() === name.toLowerCase())) {
        alert("Ce nom existe déjà.");
        return;
    }

    const avatarEl = document.querySelector(".selected-avatar");
    if (!avatarEl) {
        alert("Choisis un avatar !");
        return;
    }

    const interests = [...document.querySelectorAll(".selected-interest")].map(e => e.innerText);

    const newUser = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        name,
        password,
        avatar: avatarEl.src,
        interests
    };

    data.users.push(newUser);
    await saveDB();

    currentUser = newUser;

    loadMatchList();
    loadChatTargets();

    showScreen("match-screen");
}

/* ============================
   CONNEXION
============================ */
async function login() {
    await loadDB();

    const name = document.getElementById("login-name").value.trim();
    const pw = document.getElementById("login-password").value.trim();

    const u = data.users.find(x => x.name.toLowerCase() === name.toLowerCase() && x.password === pw);

    if (!u) {
        alert("Nom ou mot de passe incorrect.");
        return;
    }

    currentUser = u;

    loadMatchList();
    loadChatTargets();
    showScreen("match-screen");
}

/* ============================
   MATCHS
============================ */
function calcScore(u1, u2) {
    return u1.interests.filter(x => u2.interests.includes(x)).length;
}

function loadMatchList() {
    const box = document.getElementById("match-list");
    box.innerHTML = "";

    const others = data.users.filter(u => u.id !== currentUser.id);

    others.forEach(u => {
        const score = calcScore(currentUser, u);

        const d = document.createElement("div");
        d.className = "match-item";
        d.innerHTML = `
            <img src="${u.avatar}" class="avatar-mini">
            <span>${u.name}</span>
            <span class="match-score">${score}</span>
        `;

        d.addEventListener("click", () => openChat(u.id));
        box.appendChild(d);
    });
}

/* ============================
   CHAT
============================ */
function loadChatTargets() {
    const box = document.getElementById("chat-users");
    box.innerHTML = "";

    const others = data.users.filter(u => u.id !== currentUser.id);

    others.forEach(u => {
        const b = document.createElement("button");
        b.innerText = u.name;
        b.addEventListener("click", () => openChat(u.id));
        box.appendChild(b);
    });
}

let chatTarget = null;

function openChat(userId) {
    chatTarget = userId;
    showScreen("chat-screen");
    loadMessages();
}

function loadMessages() {
    const box = document.getElementById("messages");
    box.innerHTML = "";

    const msgs = data.messages.filter(
        m =>
            (m.from === currentUser.id && m.to === chatTarget) ||
            (m.from === chatTarget && m.to === currentUser.id)
    );

    msgs.forEach(m => {
        const p = document.createElement("p");
        p.innerHTML = `<strong>${m.from === currentUser.id ? "Moi" : data.users.find(u => u.id === chatTarget).name} :</strong> ${m.text}`;
        box.appendChild(p);
    });

    box.scrollTop = box.scrollHeight;
}

async function sendMessage() {
    const msg = document.getElementById("msg-input").value.trim();
    if (!msg) return;

    data.messages.push({
        from: currentUser.id,
        to: chatTarget,
        text: msg,
        time: Date.now()
    });

    await saveDB();

    document.getElementById("msg-input").value = "";
    loadMessages();
}

/* ============================
   INITIALISATION
============================ */
window.addEventListener("load", async () => {
    await loadDB();

    renderAvatarSelection("avatar-select");
    renderInterests("interests-select");

    document.getElementById("create-btn").addEventListener("click", createProfile);
    document.getElementById("login-btn").addEventListener("click", login);
    document.getElementById("send-btn").addEventListener("click", sendMessage);

    showScreen("login-screen");
});
