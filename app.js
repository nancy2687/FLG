/**************************************
    CONFIG JSONBIN
***************************************/
const BIN_ID = "691f68a643b1c97be9ba2e99";
const API_KEY = "$2a$10$KrLTFFfXVPw7N28E4PRUSua4DvOOoRT.snirM.KMgCZBH/jVSqapS";
const BASE_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

/**************************************
    VARIABLES GLOBALES
***************************************/
let currentUser = null;
let selectedInterets = [];

/**************************************
    NAVIGATION ENTRE PAGES
***************************************/
function showPage(id) {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.getElementById(id).classList.add("active");
}

/**************************************
    AVATARS
***************************************/
function setupAvatarSelection() {
    document.querySelectorAll(".avatar-choice").forEach(img => {
        img.onclick = () => {
            const parent = img.closest(".page");
            const input = parent.querySelector("input[type='hidden']");
            input.value = img.src;

            parent.querySelectorAll(".avatar-choice").forEach(i => i.classList.remove("selected"));
            img.classList.add("selected");
        };
    });
}
setupAvatarSelection();

/**************************************
    CENTRES D’INTERÊTS
***************************************/
const interetBtns = document.querySelectorAll(".interet-btn");
const interetsInput = document.getElementById("interets");

interetBtns.forEach(btn => {
    btn.onclick = () => {
        const val = btn.innerText;
        if (selectedInterets.includes(val)) {
            selectedInterets = selectedInterets.filter(i => i !== val);
            btn.classList.remove("selected");
        } else {
            selectedInterets.push(val);
            btn.classList.add("selected");
        }
        interetsInput.value = selectedInterets.join(", ");
    };
});

/**************************************
    JSONBIN – GET & UPDATE
***************************************/
async function getData() {
    const res = await fetch(BASE_URL, {
        headers: { "X-Master-Key": API_KEY }
    });
    const data = await res.json();
    if(!data.record.profiles) data.record.profiles = [];
    if(!data.record.messages) data.record.messages = [];
    return data.record;
}

async function updateData(newData) {
    await fetch(BASE_URL, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "X-Master-Key": API_KEY
        },
        body: JSON.stringify(newData)
    });
}

/**************************************
    CRÉATION DE PROFIL
***************************************/
document.getElementById("register-form").addEventListener("submit", async function(e) {
    e.preventDefault();

    const pseudo = document.getElementById("pseudo").value.trim();
    const age = document.getElementById("age").value;
    const genre = document.getElementById("genre").value;
    const recherche = document.getElementById("recherche").value;
    const avatar = document.getElementById("avatar").value;
    const interets = document.getElementById("interets").value;

    if (!pseudo || !age || !genre || !recherche || !avatar || !interets) {
        alert("Remplis tous les champs !");
        return;
    }

    currentUser = { pseudo, age, genre, recherche, avatar, interets, bio: "" };

    // enregistrer dans JSONBin
    const data = await getData();
    // si pseudo existe déjà => update
    const existingIndex = data.profiles.findIndex(p => p.pseudo === pseudo);
    if(existingIndex >=0){
        data.profiles[existingIndex] = currentUser;
    } else {
        data.profiles.push(currentUser);
    }
    await updateData(data);

    loadHomePage();
    showPage("home-page");
});

/**************************************
    PAGE D’ACCUEIL
***************************************/
async function loadHomePage() {
    document.getElementById("welcome").innerText = `Bienvenue, ${currentUser.pseudo} !`;
    document.getElementById("home-avatar").src = currentUser.avatar;
    document.getElementById("home-bio").innerText = currentUser.bio || "Aucune bio pour l’instant.";
    document.getElementById("home-interets").innerText = currentUser.interets;
}

/**************************************
    MODIFIER PROFIL
***************************************/
document.getElementById("btn-edit").onclick = () => {
    document.getElementById("edit-bio").value = currentUser.bio;
    document.getElementById("edit-avatar").value = currentUser.avatar;
    showPage("edit-page");
};

document.getElementById("save-edit").onclick = async () => {
    currentUser.bio = document.getElementById("edit-bio").value;
    currentUser.avatar = document.getElementById("edit-avatar").value || currentUser.avatar;

    // update JSONBin
    const data = await getData();
    const idx = data.profiles.findIndex(p => p.pseudo === currentUser.pseudo);
    if(idx >=0) data.profiles[idx] = currentUser;
    await updateData(data);

    loadHomePage();
    showPage("home-page");
};

document.getElementById("back-home").onclick = () => showPage("home-page");

/**************************************
    MATCHS
***************************************/
document.getElementById("btn-match").onclick = async () => {
    const data = await getData();
    const profiles = data.profiles;
    const container = document.getElementById("match-profiles");
    container.innerHTML = "";

    const matches = profiles.filter(p => {
        if(p.pseudo === currentUser.pseudo) return false;
        const interetsP = p.interets.split(", ");
        const interetsU = currentUser.interets.split(", ");
        const common = interetsP.filter(i => interetsU.includes(i));
        const compatibleGenre = currentUser.recherche === "les deux" || currentUser.recherche === p.genre;
        return common.length > 0 && compatibleGenre;
    });

    if(matches.length ===0){
        container.innerHTML = "<p>Aucun profil compatible pour le moment.</p>";
        showPage("match-page");
        return;
    }

    matches.forEach(p => {
        const div = document.createElement("div");
        div.className = "match-card";
        div.innerHTML = `
            <img src="${p.avatar}" class="mini-avatar">
            <h3>${p.pseudo}</h3>
            <p>${p.age} ans</p>
            <p>${p.genre}</p>
            <p>Centres d'intérêts : ${p.interets}</p>
            <p>${p.bio || "Aucune bio"}</p>
        `;
        container.appendChild(div);
    });

    showPage("match-page");
};

document.getElementById("back-home-2").onclick = () => showPage("home-page");

/**************************************
    MESSAGERIE
***************************************/
document.getElementById("btn-messages").onclick = async () => {
    await loadMessages();
    showPage("messages-page");
};
document.getElementById("back-home-3").onclick = () => showPage("home-page");

async function loadMessages() {
    const data = await getData();
    const box = document.getElementById("messages-box");
    box.innerHTML = "";

    const messages = data.messages.filter(m => m.from === currentUser.pseudo || m.to === currentUser.pseudo);
    messages.forEach(m => {
        const p = document.createElement("p");
        p.innerHTML = `<strong>${m.from} ➜ ${m.to} :</strong> ${m.text}`;
        box.appendChild(p);
    });
    box.scrollTop = box.scrollHeight;
}

document.getElementById("send-message").onclick = async () => {
    const input = document.getElementById("message-input");
    const text = input.value.trim();
    if(!text) return;

    const to = prompt("À qui veux-tu envoyer ce message ? (pseudo exact)");
    if(!to) return;

    const data = await getData();
    data.messages.push({ from: currentUser.pseudo, to, text, timestamp: new Date() });
    await updateData(data);

    input.value = "";
    await loadMessages();
};
