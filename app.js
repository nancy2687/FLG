let users = [], currentUser = null;
let messages = []; // {fromId, toId, text, timestamp}

// JSONBin config
const JSONBIN_URL = "https://api.jsonbin.io/v3/b/691f68a643b1c97be9ba2e99";
const JSONBIN_KEY = "$2a$10$rTm9Dc8h6mZdJWXPmGCH0O/ae7QXQa5Ke9ac/JYfC7AtbHTC9IOuS";

// Avatars et centres d'intérêt
const avatars = ["avatar1.png","avatar2.png","avatar3.png","avatar4.png"];
const interetsList = ["Musique","Sport","Lecture","Jeux","Films","Voyages"];

// ==== Pages ====
function showPage(id){
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.getElementById(id).classList.add("active");
}

// ==== Génération avatars ====
function generateAvatars(containerId){
    const container = document.getElementById(containerId);
    container.innerHTML = "";
    avatars.forEach(src=>{
        const img = document.createElement("img");
        img.src = src;
        img.classList.add("avatar-choice");
        img.addEventListener("click", () => {
            document.querySelectorAll(`#${containerId} .avatar-choice`).forEach(a=>a.classList.remove("selected"));
            img.classList.add("selected");
        });
        container.appendChild(img);
    });
}

// ==== Génération centres d'intérêt ====
function generateInterets(containerId){
    const container = document.getElementById(containerId);
    container.innerHTML = "";
    interetsList.forEach(int=>{
        const btn = document.createElement("button");
        btn.textContent = int;
        btn.classList.add("interet-btn");
        btn.addEventListener("click",()=> btn.classList.toggle("selected"));
        container.appendChild(btn);
    });
}

// ==== JSONBin Save ====
function saveUsersToJsonBin(){
    fetch(JSONBIN_URL, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "X-Master-Key": JSONBIN_KEY
        },
        body: JSON.stringify({users, messages})
    });
}

// ==== JSONBin Load ====
async function loadUsersFromJsonBin(){
    const res = await fetch(JSONBIN_URL, {
        headers: { "X-Master-Key": JSONBIN_KEY }
    });
    const data = await res.json();
    users = data.record.users || [];
    messages = data.record.messages || [];
}

// ==== Création profil ====
document.getElementById("register-form").addEventListener("submit", async e=>{
    e.preventDefault();
    const pseudo = document.getElementById("pseudo").value;
    const age = document.getElementById("age").value;
    const genre = document.querySelector('input[name="genre"]:checked')?.value;
    const recherche = Array.from(document.querySelectorAll('input[name="recherche"]:checked')).map(r=>r.value);
    const avatar = document.querySelector("#avatars .avatar-choice.selected")?.src || avatars[0];
    const interets = Array.from(document.querySelectorAll("#interets .interet-btn.selected")).map(b=>b.textContent);

    currentUser = {pseudo, age, genre, recherche, avatar, interets, bio:"", id:Date.now()};
    users.push(currentUser);
    await saveUsersToJsonBin();
    showPage("home-page");
    displayHome();
});

// ==== Affichage accueil ====
function displayHome(){
    if(!currentUser) return;
    document.getElementById("home-avatar").innerHTML = `<img src="${currentUser.avatar}" class="mini-avatar">`;
    document.getElementById("home-pseudo").textContent = `Pseudo : ${currentUser.pseudo}`;
    document.getElementById("home-age").textContent = `Âge : ${currentUser.age}`;
    document.getElementById("home-genre").textContent = `Genre : ${currentUser.genre}`;
    document.getElementById("home-recherche").textContent = `Recherche : ${currentUser.recherche.join(", ")}`;
    document.getElementById("home-bio").textContent = `Bio : ${currentUser.bio}`;
    document.getElementById("home-interets").textContent = `Centres d'intérêt : ${currentUser.interets.join(", ")}`;
}

// ==== Modifier profil ====
document.getElementById("btn-edit").addEventListener("click", ()=>{
    document.getElementById("edit-bio").value = currentUser.bio;
    showPage("edit-page");
});

document.getElementById("save-edit").addEventListener("click", async ()=>{
    currentUser.bio = document.getElementById("edit-bio").value;
    const selectedAvatar = document.querySelector("#edit-avatars .avatar-choice.selected")?.src;
    if(selectedAvatar) currentUser.avatar = selectedAvatar;
    currentUser.interets = Array.from(document.querySelectorAll("#edit-interets .interet-btn.selected")).map(b=>b.textContent);
    await saveUsersToJsonBin();
    showPage("home-page");
    displayHome();
});

// ==== Retour accueil ====
document.getElementById("back-home").addEventListener("click", ()=>showPage("home-page"));
document.getElementById("back-home-2").addEventListener("click", ()=>showPage("home-page"));
document.getElementById("back-home-3").addEventListener("click", ()=>showPage("home-page"));

// ==== Matchs ====
document.getElementById("btn-match").addEventListener("click", ()=>{
    const container = document.getElementById("match-profiles");
    container.innerHTML="";
    users.forEach(u=>{
        if(u.id !== currentUser.id){
            const genreOK = currentUser.recherche.includes(u.genre) || currentUser.recherche.includes("les deux");
            const rechercheOK = u.recherche.includes(currentUser.genre) || u.recherche.includes("les deux");
            if(genreOK && rechercheOK){
                const div = document.createElement("div");
                div.innerHTML = `<img src="${u.avatar}" class="mini-avatar"><span>${u.pseudo} (${u.age})</span>`;
                div.addEventListener("click", ()=>openChat(u.id));
                container.appendChild(div);
            }
        }
    });
    showPage("match-page");
});

// ==== Messagerie ====
function openChat(userId){
    const chatWith = users.find(u=>u.id===userId);
    if(!chatWith) return;
    showPage("messages-page");
    displayMessages(chatWith.id);
    document.getElementById("send-message").onclick = async ()=>{
        const text = document.getElementById("message-input").value;
        if(text.trim()==="") return;
        messages.push({fromId:currentUser.id, toId:chatWith.id, text, timestamp:Date.now()});
        document.getElementById("message-input").value="";
        await saveUsersToJsonBin();
        displayMessages(chatWith.id);
    };
}

function displayMessages(withId){
    const box = document.getElementById("messages-box");
    box.innerHTML="";
    messages.filter(m=> (m.fromId===currentUser.id && m.toId===withId) || (m.fromId===withId && m.toId===currentUser.id))
        .forEach(m=>{
            const div = document.createElement("div");
            div.textContent = `${users.find(u=>u.id===m.fromId).pseudo}: ${m.text}`;
            box.appendChild(div);
        });
    box.scrollTop = box.scrollHeight;
}

// ==== Bouton messages accueil ====
document.getElementById("btn-messages").addEventListener("click", ()=>{
    const firstMatch = users.find(u=>{
        if(u.id===currentUser.id) return false;
        const genreOK = currentUser.recherche.includes(u.genre) || currentUser.recherche.includes("les deux");
        const rechercheOK = u.recherche.includes(currentUser.genre) || u.recherche.includes("les deux");
        return genreOK && rechercheOK;
    });
    if(firstMatch) openChat(firstMatch.id);
    else alert("Pas encore de match !");
});

// ==== Init page ====
window.onload=async ()=>{
    generateAvatars("avatars");
    generateAvatars("edit-avatars");
    generateInterets("interets");
    generateInterets("edit-interets");
    await loadUsersFromJsonBin();
};
