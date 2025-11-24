/* ============================
   app.js - FIXED version
   Matches your HTML (login-screen, create-screen, ...)
   No page reload on send, robust JSONBin handling
   ============================ */

/* ===== JSONBin config ===== */
const BIN_ID = "691f68a643b1c97be9ba2e99";
const MASTER_KEY = "$2a$10$PmlFg26zdZb1HToAvYN/Ruc/55x7rI5Vqf769Vcj7dI4EipYpG0cu";
const API_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

/* ===== App state ===== */
let dataStore = { users: [], messages: [] };
let currentUser = null;
let chatTargetId = null;

/* ===== Helpers ===== */
function q(id){ return document.getElementById(id); }
function safeText(s){ return (s||"").toString().trim(); }

/* ===== Load / Save JSONBin ===== */
async function loadDB(){
  try{
    const res = await fetch(API_URL, { headers: { "X-Master-Key": MASTER_KEY } });
    const json = await res.json();
    dataStore = json.record || { users: [], messages: [] };
    if(!Array.isArray(dataStore.users)) dataStore.users = [];
    if(!Array.isArray(dataStore.messages)) dataStore.messages = [];
    console.log("loadDB OK", dataStore);
  } catch(err){
    console.error("loadDB error", err);
    // keep existing dataStore if fetch fails
    if(!dataStore) dataStore = { users: [], messages: [] };
  }
}

async function saveDB(){
  try{
    await fetch(API_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-Master-Key": MASTER_KEY },
      body: JSON.stringify(dataStore)
    });
    console.log("saveDB OK");
  } catch(err){
    console.error("saveDB error", err);
    alert("Erreur: impossible de sauvegarder (regarde la console).");
  }
}

/* ===== UI: screen switch ===== */
function showScreen(screenId){
  document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
  const el = document.getElementById(screenId);
  if(el) el.classList.remove("hidden");
}

/* ===== Avatars & interests rendering ===== */
const AVATAR_COUNT = 6;
const INTERESTS = ["Sport","Musique","Danse","Mode","Jeux vidéo","Lecture","Voyage","Informatique"];

function renderAvatarSelection(containerId, selectedSrc){
  const container = q(containerId);
  if(!container) return;
  container.innerHTML = "";
  for(let i=1;i<=AVATAR_COUNT;i++){
    const img = document.createElement("img");
    img.src = `avatar${i}.png`;
    img.alt = `avatar${i}`;
    img.style.cursor = "pointer";
    img.classList.add("avatar-choice");
    if(selectedSrc && selectedSrc === img.src) img.classList.add("selected-avatar");
    img.addEventListener("click", ()=>{
      container.querySelectorAll("img").forEach(x=>x.classList.remove("selected-avatar"));
      img.classList.add("selected-avatar");
    });
    container.appendChild(img);
  }
}

function renderInterestButtons(containerId, selected = []){
  const container = q(containerId);
  if(!container) return;
  container.innerHTML = "";
  INTERESTS.forEach(it => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "interest-btn";
    btn.textContent = it;
    if(selected.includes(it)) btn.classList.add("selected-interest");
    btn.addEventListener("click", ()=> btn.classList.toggle("selected-interest"));
    container.appendChild(btn);
  });
}

/* ===== Create profile (safe) ===== */
async function createProfile(){
  // ensure DB up-to-date
  await loadDB();

  const name = safeText(q("name").value);
  const password = safeText(q("password").value);

  if(!name || !password){ alert("Remplis ton nom et mot de passe."); return; }

  // duplicate check (case-insensitive)
  if(dataStore.users.some(u => (u.name||"").toLowerCase() === name.toLowerCase())){
    alert("Ce nom existe déjà — choisis-en un autre.");
    return;
  }

  const avatarImg = document.querySelector("#avatar-select .selected-avatar");
  if(!avatarImg){ alert("Choisis un avatar !"); return; }
  const avatar = avatarImg.src;

  const selectedInterests = Array.from(document.querySelectorAll("#interests-select .selected-interest")).map(b => b.innerText);

  const newUser = {
    id: Date.now() + Math.floor(Math.random()*1000),
    name,
    password,
    avatar,
    interests: selectedInterests
  };

  dataStore.users.push(newUser);
  await saveDB();

  currentUser = newUser;
  // prepare UI
  loadMatchList();
  populateChatTargets();
  showScreen("match-screen");
}

/* ===== Login (safe) ===== */
async function login(){
  await loadDB();

  const name = safeText(q("login-name").value);
  const password = safeText(q("login-password").value);

  const user = dataStore.users.find(u => (u.name||"").toLowerCase() === name.toLowerCase() && u.password === password);
  if(!user){ alert("Nom ou mot de passe incorrect."); return; }

  currentUser = user;
  loadMatchList();
  populateChatTargets();
  showScreen("match-screen");
}

/* ===== Match list ===== */
function calcCommonInterests(u1, u2){
  const a = u1.interests || [];
  const b = u2.interests || [];
  return a.filter(x => b.includes(x)).length;
}

function loadMatchList(){
  const box = q("match-list");
  if(!box) return;
  box.innerHTML = "";

  const others = dataStore.users.filter(u => u.id !== currentUser.id);
  if(others.length === 0){ box.innerHTML = "<p>Aucun autre utilisateur pour l'instant.</p>"; return; }

  others.forEach(u => {
    const score = calcCommonInterests(currentUser, u);
    const card = document.createElement("div");
    card.className = "match-card";
    card.style.display = "flex";
    card.style.alignItems = "center";
    card.style.gap = "10px";
    card.style.padding = "8px";
    card.style.border = "1px solid #eee";
    card.style.borderRadius = "8px";
    card.style.cursor = "pointer";

    const img = document.createElement("img"); img.src = u.avatar; img.width = 48; img.height = 48; img.style.borderRadius = "50%";
    const info = document.createElement("div");
    info.innerHTML = `<strong>${u.name}</strong><div style="font-size:12px;color:#666">${(u.interests||[]).join(", ")}</div>`;
    const scoreEl = document.createElement("div");
    scoreEl.textContent = `👍 ${score}`;
    scoreEl.style.marginLeft = "auto";
    scoreEl.style.fontWeight = "600";
    scoreEl.style.color = "#ff1493";

    card.appendChild(img); card.appendChild(info); card.appendChild(scoreEl);
    card.addEventListener("click", ()=> openChat(u.id));

    box.appendChild(card);
  });
}

/* ===== Chat ===== */
function populateChatTargets(){
  const sel = q("chat-target-select");
  if(!sel) return;
  sel.innerHTML = "";
  dataStore.users.filter(u => u.id !== currentUser.id).forEach(u => {
    const opt = document.createElement("option");
    opt.value = u.id;
    opt.text = u.name;
    sel.appendChild(opt);
  });
  // default selection
  if(sel.options.length > 0) sel.selectedIndex = 0;
  // load messages for default
  chatTargetId = Number(sel.value) || null;
  loadMessagesForSelected();
}

function getSelectedChatTarget(){
  const sel = q("chat-target-select");
  if(!sel) return null;
  return Number(sel.value);
}

function openChat(userId){
  chatTargetId = userId;
  // set select value if exists
  const sel = q("chat-target-select");
  if(sel){
    const opt = Array.from(sel.options).find(o => Number(o.value) === userId);
    if(opt) sel.value = opt.value;
  }
  showScreen("chat-screen");
  loadMessagesForSelected();
}

function loadMessagesForSelected(){
  const target = getSelectedChatTarget();
  const box = q("messages-box");
  if(!box) return;
  box.innerHTML = "";
  if(!target){ box.innerHTML = "<p>Sélectionne une personne.</p>"; return; }

  const conv = dataStore.messages
    .filter(m => (m.from === currentUser.id && m.to === target) || (m.from === target && m.to === currentUser.id))
    .sort((a,b)=> a.time - b.time);

  conv.forEach(m => {
    const div = document.createElement("div");
    div.className = "message " + (m.from === currentUser.id ? "me" : "them");
    div.style.padding = "6px";
    div.style.margin = "6px 0";
    div.style.borderRadius = "6px";
    if(m.from === currentUser.id){
      div.style.background = "#b3f0ff";
      div.style.textAlign = "right";
    } else {
      div.style.background = "#ffd2ec";
      div.style.textAlign = "left";
    }
    const sender = (m.from === currentUser.id) ? "Moi" : (dataStore.users.find(u=>u.id===m.from)?.name || "?");
    div.innerHTML = `<strong>${sender}</strong>: ${m.text}`;
    box.appendChild(div);
  });
  box.scrollTop = box.scrollHeight;
}

/* send message (no submit) */
async function sendMessage(){
  const textInput = q("message-input");
  const txt = safeText(textInput.value);
  const target = getSelectedChatTarget();
  if(!txt) return;
  if(!target){ alert("Choisis une personne."); return; }
  dataStore.messages.push({
    from: currentUser.id,
    to: Number(target),
    text: txt,
    time: Date.now()
  });
  // save then refresh UI
  await saveDB();
  textInput.value = "";
  // reload remote DB to get other user's messages too (in case they sent quickly)
  await loadDB();
  loadMessagesForSelected();
}

/* ===== Profile edit/save ===== */
function loadProfileEditor(){
  q("edit-name").value = currentUser.name || "";
  q("edit-password").value = currentUser.password || "";
  renderAvatarSelection("avatar-edit-select", currentUser.avatar);
  renderInterestButtons("interests-edit-select", currentUser.interests || []);
}

async function saveProfileEdits(){
  const newName = safeText(q("edit-name").value);
  const newPwd = safeText(q("edit-password").value);
  if(!newName || !newPwd){ alert("Nom et mot de passe requis"); return; }

  // check duplicate name (if changed)
  if(newName.toLowerCase() !== currentUser.name.toLowerCase()){
    if(dataStore.users.some(u => u.name.toLowerCase() === newName.toLowerCase())){
      alert("Ce nom est déjà pris.");
      return;
    }
  }

  const avatarEl = document.querySelector("#avatar-edit-select .selected-avatar");
  if(avatarEl) currentUser.avatar = avatarEl.src;
  currentUser.name = newName;
  currentUser.password = newPwd;
  currentUser.interests = Array.from(document.querySelectorAll("#interests-edit-select .selected-interest")).map(b => b.innerText);

  // update dataStore
  const idx = dataStore.users.findIndex(u => u.id === currentUser.id);
  if(idx >= 0) dataStore.users[idx] = currentUser;
  await saveDB();
  alert("Profil sauvegardé.");
  loadMatchList();
  populateChatTargets();
  showScreen("match-screen");
}

/* ===== Bind UI and init ===== */
function bindUI(){
  // CREATE: ensure button type="button" usage in HTML; here bind safely
  const createBtn = document.querySelector("#create-btn");
  if(createBtn){
    createBtn.type = "button";
    createBtn.addEventListener("click", createProfile);
  }

  // LOGIN
  const loginBtn = document.querySelector("#login-btn");
  if(loginBtn){
    loginBtn.type = "button";
    loginBtn.addEventListener("click", login);
  }

  // Chat send button
  const sendBtn = document.querySelector("#send-message-btn");
  if(sendBtn){
    sendBtn.type = "button";
    sendBtn.addEventListener("click", sendMessage);
  }

  // prevent accidental form submit if there is any form (safety)
  document.querySelectorAll("form").forEach(f => {
    f.addEventListener("submit", (e) => { e.preventDefault(); });
  });

  // chat select change -> reload messages
  const chatSel = q("chat-target-select");
  if(chatSel) chatSel.addEventListener("change", () => {
    chatTargetId = Number(chatSel.value);
    loadMessagesForSelected();
  });

  // profile editor open/save
  const openProfileButtons = document.querySelectorAll(".open-profile-btn");
  openProfileButtons.forEach(b => b.addEventListener("click", () => {
    loadProfileEditor();
    showScreen("profile-screen");
  }));

  const saveProfileBtn = q("save-profile-btn");
  if(saveProfileBtn) saveProfileBtn.addEventListener("click", saveProfileEdits);

  // back buttons
  const backFromChat = document.querySelectorAll(".back-to-matches");
  backFromChat.forEach(b => b.addEventListener("click", ()=> showScreen("match-screen")));
}

/* ===== STARTUP ===== */
window.addEventListener("load", async () => {
  // render avatar/interests containers that must exist in HTML
  if(q("avatar-select")) renderAvatarSelection("avatar-select");
  if(q("avatar-edit-select")) renderAvatarSelection("avatar-edit-select");
  if(q("interests-select")) renderInterestButtons("interests-select");
  if(q("interests-edit-select")) renderInterestButtons("interests-edit-select");

  bindUI();

  // initial load
  await loadDB();

  // if you want auto-login via localStorage (optional)
  const savedName = localStorage.getItem("app_username");
  if(savedName){
    const u = dataStore.users ? dataStore.users.find(x => x.name === savedName) : null;
    if(u){ currentUser = u; loadMatchList(); populateChatTargets(); showScreen("match-screen"); return; }
  }

  // default to login screen
  showScreen("login-screen");

  // poll every 2.5s to sync messages & users (optional)
  setInterval(async () => {
    await loadDB();
    if(currentUser){
      // update UI if needed
      loadMatchList();
      populateChatTargets();
      // if in chat screen, refresh messages view
      if(!q("chat-screen").classList.contains("hidden")){
        loadMessagesForSelected();
      }
    }
  }, 2500);
});
