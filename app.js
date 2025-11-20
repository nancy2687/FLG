// ======== CONFIG JSONBIN =========
const JSONBIN_URL = "https://api.jsonbin.io/v3/b/691f68a643b1c97be9ba2e99";
const MASTER_KEY = "$2a$10$rTm9Dc8h6mZdJWXPmGCH0O/ae7QXQa5Ke9ac/JYfC7AtbHTC9IOuS";

// ======== DONNEES DYNAMIQUES =======
let users = [];
let currentUser = null;
let messages = [];

// Avatars et centres d'intérêt
const avatars = ["avatar1.png","avatar2.png","avatar3.png","avatar4.png"];
const interetsList = ["Musique","Sport","Lecture","Jeux","Films","Voyages"];

// ======== UTILITAIRES =======
function showPage(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

function generateAvatars(containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  avatars.forEach(src => {
    const img = document.createElement("img");
    img.src = src;
    img.classList.add("avatar-choice");
    img.addEventListener("click", () => {
      document.querySelectorAll(`#${containerId} .avatar-choice`).forEach(a => a.classList.remove("selected"));
      img.classList.add("selected");
    });
    container.appendChild(img);
  });
}

function generateInterets(containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  interetsList.forEach(int => {
    const btn = document.createElement("button");
    btn.textContent = int;
    btn.classList.add("interet-btn");
    btn.addEventListener("click", () => btn.classList.toggle("selected"));
    container.appendChild(btn);
  });
}

// ======== CREATION DE PROFIL =======
const registerForm = document.getElementById("register-form");
registerForm.addEventListener("submit", e => {
  e.preventDefault();
  const pseudo = document.getElementById("pseudo").value;
  const age = document.getElementById("age").value;
  const genre = document.querySelector('input[name="genre"]:checked')?.value;
  const recherche = Array.from(document.querySelectorAll('input[name="recherche"]:checked')).map(r => r.value);
  const avatar = document.querySelector("#avatars .avatar-choice.selected")?.src || avatars[0];
  const interets = Array.from(document.querySelectorAll("#interets .interet-btn.selected")).map(b => b.textContent);

  currentUser = { pseudo, age, genre, recherche, avatar, interets, bio:"", id:Date.now() };
  users.push(currentUser);

  // Enregistrer sur JSONBin
  saveData();

  showPage("home-page");
  displayHome();
  loadMessages();
});

// ======== AFFICHAGE PAGE ACCUEIL =======
function displayHome() {
  if (!currentUser) return;
  document.getElementById("home-avatar").innerHTML = `<img src="${currentUser.avatar}" class="mini-avatar">`;
  document.getElementById("home-pseudo").textContent = `Pseudo : ${currentUser.pseudo}`;
  document.getElementById("home-age").textContent = `Âge : ${currentUser.age}`;
  document.getElementById("home-genre").textContent = `Genre : ${currentUser.genre}`;
  document.getElementById("home-recherche").textContent = `Recherche : ${currentUser.recherche.join(", ")}`;
  document.getElementById("home-bio").textContent = `Bio : ${currentUser.bio}`;
  document.getElementById("home-interets").textContent = `Centres d'intérêt : ${currentUser.interets.join(", ")}`;
}

// ======== MODIFICATION PROFIL =======
document.getElementById("btn-edit").addEventListener("click", () => {
  showPage("edit-page");
  document.getElementById("edit-bio").value = currentUser.bio;
  generateAvatars("edit-avatars");
  generateInterets("edit-interets");

  // Sélectionner avatar actuel
  document.querySelectorAll("#edit-avatars .avatar-choice").forEach(a => {
    if(a.src === currentUser.avatar) a.classList.add("selected");
  });

  // Sélectionner interets actuels
  document.querySelectorAll("#edit-interets .interet-btn").forEach(b => {
    if(currentUser.interets.includes(b.textContent)) b.classList.add("selected");
  });
});

document.getElementById("save-edit").addEventListener("click", () => {
  currentUser.bio = document.getElementById("edit-bio").value;
  currentUser.avatar = document.querySelector("#edit-avatars .avatar-choice.selected")?.src || avatars[0];
  currentUser.interets = Array.from(document.querySelectorAll("#edit-interets .interet-btn.selected")).map(b => b.textContent);
  saveData();
  showPage("home-page");
  displayHome();
});

// ======== MATCHS =======
document.getElementById("btn-match").addEventListener("click", () => {
  showPage("match-page");
  displayMatches();
});

document.getElementById("back-home-2").addEventListener("click", () => showPage("home-page"));

function displayMatches() {
  const container = document.getElementById("match-profiles");
  container.innerHTML = "";
  if(!users || users.length < 2){
    container.innerHTML = "<p>Pas assez de profils pour matcher</p>";
    return;
  }
  users.forEach(u => {
    if(u.id !== currentUser.id){
      const div = document.createElement("div");
      div.classList.add("match-card");
      div.innerHTML = `<img src="${u.avatar}" class="mini-avatar"><span>${u.pseudo}</span>`;
      container.appendChild(div);
    }
  });
}

// ======== MESSAGERIE =======
document.getElementById("btn-messages").addEventListener("click", () => {
  showPage("messages-page");
  loadMessages();
});

document.getElementById("back-home-3").addEventListener("click", () => showPage("home-page"));

document.getElementById("send-message").addEventListener("click", () => {
  const text = document.getElementById("message-input").value.trim();
  if(!text) return;
  messages.push({user: currentUser.pseudo, text});
  document.getElementById("message-input").value = "";
  saveData();
  loadMessages();
});

function loadMessages() {
  const messagesBox = document.getElementById("messages-box");
  messagesBox.innerHTML = "";
  messages.forEach(msg => {
    const div = document.createElement("div");
    div.textContent = `${msg.user}: ${msg.text}`;
    messagesBox.appendChild(div);
  });
  messagesBox.scrollTop = messagesBox.scrollHeight;
}

// ======== JSONBIN =======
async function saveData(){
  const payload = { users, messages };
  await fetch(JSONBIN_URL, {
    method:"PUT",
    headers: {
      "Content-Type":"application/json",
      "X-Master-Key": MASTER_KEY
    },
    body: JSON.stringify(payload)
  });
}

async function loadData(){
  const res = await fetch(JSONBIN_URL,{
    method:"GET",
    headers:{
      "X-Master-Key": MASTER_KEY
    }
  });
  const data = await res.json();
  users = data.record.users || [];
  messages = data.record.messages || [];
}

window.onload = async () => {
  generateAvatars("avatars");
  generateAvatars("edit-avatars");
  generateInterets("interets");
  generateInterets("edit-interets");
  await loadData();
}
