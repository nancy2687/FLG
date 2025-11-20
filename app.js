/**************************************
    CONFIG JSONBIN
***************************************/
const BIN_ID = "691f68a643b1c97be9ba2e99";
const API_KEY = "$2a$10$KhoJX2sPUt9OHdcYvYIqq.VyHvq6UtogZMUPUFl1QmHd5WrEXg156";
const API_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;


/**************************************
    FONCTIONS JSONBIN
***************************************/
async function loadProfiles() {
    const res = await fetch(API_URL, {
        headers: { "X-Master-Key": API_KEY }
    });
    const data = await res.json();
    return data.record || [];
}

async function saveProfiles(profiles) {
    await fetch(API_URL, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "X-Master-Key": API_KEY
        },
        body: JSON.stringify(profiles)
    });
}


/**************************************
    NAVIGATION ENTRE PAGES
***************************************/
function showPage(id) {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.getElementById(id).classList.add("active");
}


/**************************************
    VARIABLES GLOBALES
***************************************/
let currentUser = null;


/**************************************
    AVATARS (sélection)
***************************************/
function setupAvatarSelection() {
    document.querySelectorAll(".avatar-choice").forEach(img => {
        img.onclick = () => {
            document.getElementById("avatar").value = img.src; // Mettre valeur dans input hidden
            document.querySelectorAll(".avatar-choice").forEach(i => i.classList.remove("selected"));
            img.classList.add("selected");
        };
    });
}
setupAvatarSelection();
// CENTRES D’INTÉRÊTS
const interetBtns = document.querySelectorAll(".interet-btn");
const interetsInput = document.getElementById("interets");
let selectedInterets = [];

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
    CRÉATION DE PROFIL
***************************************/
document.getElementById("register-form").onsubmit = async (e) => {
    e.preventDefault(); // Empêche le rechargement de la page

    const pseudo = document.getElementById("pseudo").value.trim();
    const age = document.getElementById("age").value;
    const genre = document.getElementById("genre").value;
    const recherche = document.getElementById("recherche").value;
    const avatar = document.getElementById("avatar").value;

    if (!pseudo || !age || !genre || !recherche) {
        alert("Remplis tous les champs !");
        return;
    }

    if (!avatar) {
        alert("Choisis un avatar !");
        return;
    }

    // Charge profils existants
    let profiles = await loadProfiles();

    // Crée le nouvel utilisateur
    currentUser = {
        id: Date.now(),
        pseudo,
        age,
        genre,
        recherche,
        avatar,
        bio: ""
    };

    profiles.push(currentUser);

    // Sauvegarde sur JSONBin
    await saveProfiles(profiles);

    // Affiche la page d’accueil
    loadHomePage();
    showPage("home-page");
};


/**************************************
    PAGE D’ACCUEIL PERSONNELLE
***************************************/
function loadHomePage() {
    document.getElementById("welcome").innerText = `Bienvenue, ${currentUser.pseudo} !`;
    document.getElementById("home-avatar").src = currentUser.avatar;
    document.getElementById("home-bio").innerText = currentUser.bio || "Aucune bio pour l’instant.";
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
    const newBio = document.getElementById("edit-bio").value;
    const newAvatar = document.getElementById("edit-avatar").value || currentUser.avatar;

    let profiles = await loadProfiles();

    profiles = profiles.map(p =>
        p.id === currentUser.id
            ? { ...p, bio: newBio, avatar: newAvatar }
            : p
    );

    currentUser.bio = newBio;
    currentUser.avatar = newAvatar;

    await saveProfiles(profiles);

    loadHomePage();
    showPage("home-page");
};

document.getElementById("back-home").onclick = () => showPage("home-page");


/**************************************
    MATCH : afficher profils compatibles
***************************************/
document.getElementById("btn-match").onclick = async () => {
    let profiles = await loadProfiles();

    // Filtrer tous les autres profils
    const match = profiles.filter(p => p.id !== currentUser.id);

    const container = document.getElementById("match-profiles");
    container.innerHTML = "";

    if (match.length === 0) {
        container.innerHTML = "<p>Aucun profil pour le moment 😢</p>";
    } else {
        match.forEach(p => {
            const div = document.createElement("div");
            div.className = "match-card";
            div.innerHTML = `
                <img src="${p.avatar}" class="mini-avatar">
                <h3>${p.pseudo}</h3>
                <p>${p.age} ans</p>
                <p>${p.genre}</p>
                <p>${p.bio || "Aucune bio"}</p>
            `;
            container.appendChild(div);
        });
    }

    showPage("match-page");
};

document.getElementById("back-home-2").onclick = () => showPage("home-page");


/**************************************
    MESSAGES
***************************************/
document.getElementById("btn-messages").onclick = () => showPage("messages-page");
document.getElementById("back-home-3").onclick = () => showPage("home-page");
