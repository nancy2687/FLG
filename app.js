// -----------------------
// JSONBIN CONFIG
// -----------------------

const BIN_ID = "691f68a643b1c97be9ba2e99";
const MASTER_KEY = "$2a$10$KrLTFFfXVPw7N28E4PRUSua4DvOOoRT.snirM.KMgCZBH/jVSqapS";

const API_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;
const HEADERS = {
    "X-Master-Key": MASTER_KEY,
    "Content-Type": "application/json"
};

let data = { users: [], messages: [] };
let currentUser = null;

// -----------------------
// LOAD DATA
// -----------------------
async function loadDB() {
    const res = await fetch(API_URL, { headers: HEADERS });
    const json = await res.json();
    data = json.record;
    console.log("DB loaded", data);
}

// -----------------------
async function saveDB() {
    await fetch(API_URL, {
        method: "PUT",
        headers: HEADERS,
        body: JSON.stringify(data)
    });
}

// -----------------------
function showScreen(id) {
    document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
    document.getElementById(id).classList.remove("hidden");
}

// -----------------------
// AVATARS + INTERESTS
// -----------------------

const interests = ["Sport", "Musique", "Lecture", "Informatique", "Jeux vidéo", "Voyage"];

function renderAvatarSelection(divId, selectedPath) {
    const div = document.getElementById(divId);
    div.innerHTML = "";

    for (let i = 1; i <= 8; i++) {
        const img = document.createElement("img");
        img.src = "avatar" + i + ".png";

        if (selectedPath === img.src) img.classList.add("selected-avatar");

        img.onclick = () => {
            div.querySelectorAll("img").forEach(e => e.classList.remove("selected-avatar"));
            img.classList.add("selected-avatar");
        };

        div.appendChild(img);
    }
}

function renderInterests(divId, selectedList = []) {
    const div = document.getElementById(divId);
    div.innerHTML = "";

    interests.forEach(interest => {
        const btn = document.createElement("span");
        btn.className = "interest-btn";
        btn.innerText = interest;

        if (selectedList.includes(interest)) btn.classList.add("selected-interest");

        btn.onclick = () => btn.classList.toggle("selected-interest");

        div.appendChild(btn);
    });
}

// -----------------------
// CREATE ACCOUNT
// -----------------------

async function createProfile() {
    const name = document.getElementById("name").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!name || !password) return alert("Complète tout !");

    const avatar = document.querySelector("#avatar-select .selected-avatar");
    if (!avatar) return alert("Choisis un avatar !");

    const interests = [...document.querySelectorAll("#interests-select .selected-interest")].map(b => b.innerText);

    const user = {
        name,
        password,
        avatar: avatar.src,
        interests,
        id: Date.now()
    };

    data.users.push(user);
    await saveDB();

    alert("Compte créé !");
    showScreen("login-screen");
}

// -----------------------
// LOGIN
// -----------------------

async function login() {
    const name = document.getElementById("login-name").value.trim();
    const password = document.getElementById("login-password").value.trim();

    await loadDB();

    const user = data.users.find(u => u.name === name && u.password === password);
    if (!user) return alert("Identifiants incorrects");

    currentUser = user;

    loadMatchList();
    loadChatTargets();
    showScreen("match-screen");
}

// -----------------------
// MATCH LIST
// -----------------------

function loadMatchList() {
    const div = document.getElementById("match-list");
    div.innerHTML = "";

    data.users
        .filter(u => u.id !== currentUser.id)
        .forEach(u => {
            const block = document.createElement("div");
            block.innerHTML = `
                <img src="${u.avatar}" width="50">
                <b>${u.name}</b>
                <p>${u.interests.join(", ")}</p>
            `;
            div.appendChild(block);
        });
}

// -----------------------
// CHAT
// -----------------------

function loadChatTargets() {
    const sel = document.getElementById("chat-target-select");
    sel.innerHTML = "";

    data.users.forEach(u => {
        if (u.id !== currentUser.id) {
            const opt = document.createElement("option");
            opt.value = u.id;
            opt.textContent = u.name;
            sel.appendChild(opt);
        }
    });

    sel.onchange = loadMessages;
}

function loadMessages() {
    const targetId = Number(document.getElementById("chat-target-select").value);
    const box = document.getElementById("messages-box");

    box.innerHTML = "";

    data.messages
        .filter(msg =>
            (msg.from === currentUser.id && msg.to === targetId) ||
            (msg.to === currentUser.id && msg.from === targetId)
        )
        .forEach(msg => {
            const div = document.createElement("div");
            div.className = "message " + (msg.from === currentUser.id ? "me" : "them");
            div.textContent = msg.text;
            box.appendChild(div);
        });
}

async function sendMessage() {
    const input = document.getElementById("message-input");
    const text = input.value.trim();
    if (!text) return;

    const target = Number(document.getElementById("chat-target-select").value);

    data.messages.push({
        from: currentUser.id,
        to: target,
        text,
        time: Date.now()
    });

    await saveDB();
    loadMessages();

    input.value = "";
}

// 🔥 FIX DU RECHARGEMENT DE PAGE
document.getElementById("send-message-form").addEventListener("submit", e => {
    e.preventDefault();
});

document.getElementById("send-message-btn").onclick = sendMessage;

// -----------------------
// PROFILE
// -----------------------

function loadProfileEditor() {
    document.getElementById("edit-name").value = currentUser.name;
    document.getElementById("edit-password").value = currentUser.password;

    renderAvatarSelection("avatar-edit-select", currentUser.avatar);
    renderInterests("interests-edit-select", currentUser.interests);
}

async function saveProfile() {
    currentUser.name = document.getElementById("edit-name").value;
    currentUser.password = document.getElementById("edit-password").value;

    const avatar = document.querySelector("#avatar-edit-select .selected-avatar");
    currentUser.avatar = avatar.src;

    currentUser.interests = [...document.querySelectorAll("#interests-edit-select .selected-interest")]
        .map(e => e.innerText);

    await saveDB();
    alert("Profil mis à jour !");
}

renderAvatarSelection("avatar-select");
renderInterests("interests-select");
