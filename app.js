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
    CRÉATION DE PROFIL
***************************************/
document.getElementById("register-form").addEventListener("submit", function(e) {
    e.preventDefault(); // empêche le rechargement

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

    console.log("Profil créé :", currentUser); // pour tester
    loadHomePage();
    showPage("home-page");
});

/**************************************
    PAGE D’ACCUEIL
***************************************/
function loadHomePage() {
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

document.getElementById("save-edit").onclick = () => {
    const newBio = document.getElementById("edit-bio").value;
    const newAvatar = document.getElementById("edit-avatar").value || currentUser.avatar;

    currentUser.bio = newBio;
    currentUser.avatar = newAvatar;

    loadHomePage();
    showPage("home-page");
};

document.getElementById("back-home").onclick = () => showPage("home-page");

/**************************************
    MATCH
***************************************/
document.getElementById("btn-match").onclick = () => {
    const container = document.getElementById("match-profiles");
    container.innerHTML = "";

    // Pour test, on va juste afficher des copies du currentUser
    const profiles = [currentUser]; // Ici tu peux ajouter d'autres profils test
    profiles.forEach(p => {
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
    MESSAGES
***************************************/
document.getElementById("btn-messages").onclick = () => showPage("messages-page");
document.getElementById("back-home-3").onclick = () => showPage("home-page");
