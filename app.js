/* ===== app.js — version finale avec JSONBin ===== */

/* ---------- CONFIG JSONBIN (TA BIN) ---------- */
const JSONBIN_URL = "https://api.jsonbin.io/v3/b/691f68a643b1c97be9ba2e99";
const JSONBIN_KEY = "$2a$10$KrLTFFfXVPw7N28E4PRUSua4DvOOoRT.snirM.KMgCZBH/jVSqapS";

/* ---------- STATE ---------- */
let users = [];
let messages = [];
let currentUser = null;

/* avatars & interests (local filenames) */
const avatars = ["avatar1.png","avatar2.png","avatar3.png","avatar4.png"];
const interestsCatalog = ["Musique","Sport","Lecture","Jeux","Films","Voyages"];

/* ---------- UI helpers ---------- */
function showPage(id){
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  const el = document.getElementById(id);
  if(el) el.classList.add("active");
}

/* ---------- JSONBin load/save ---------- */
async function loadFromBin(){
  try{
    const res = await fetch(JSONBIN_URL, { headers: { "X-Master-Key": JSONBIN_KEY }});
    const json = await res.json();
    const record = json.record || {};
    users = record.users || [];
    messages = record.messages || [];
    // rehydrate currentUser from localStorage username if present
    const stored = localStorage.getItem("app_username");
    if(stored){
      const u = users.find(x => x.username === stored);
      if(u){ currentUser = u; onLoginSuccess(); }
    }
    renderHomeIfNeeded();
    renderConversationsList();
  }catch(err){
    console.error("Erreur loadFromBin:", err);
  }
}

async function saveToBin(){
  try{
    const payload = { users, messages };
    await fetch(JSONBIN_URL, {
      method: "PUT",
      headers: { "Content-Type":"application/json", "X-Master-Key": JSONBIN_KEY },
      body: JSON.stringify(payload)
    });
  }catch(err){
    console.error("Erreur saveToBin:", err);
  }
}

/* ---------- Generate avatars & interests UI ---------- */
function generateAvatarChoices(containerId){
  const c = document.getElementById(containerId);
  if(!c) return;
  c.innerHTML = "";
  avatars.forEach(src => {
    const img = document.createElement("img");
    img.src = src;
    img.className = "avatar-choice";
    img.addEventListener("click", () => {
      c.querySelectorAll(".avatar-choice").forEach(i => i.classList.remove("selected"));
      img.classList.add("selected");
    });
    c.appendChild(img);
  });
}

function generateInterestButtons(containerId){
  const c = document.getElementById(containerId);
  if(!c) return;
  c.innerHTML = "";
  interestsCatalog.forEach(i => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "interet-btn";
    b.textContent = i;
    b.addEventListener("click", () => b.classList.toggle("selected"));
    c.appendChild(b);
  });
}

/* ---------- Auth helpers ---------- */
function findUserByUsername(username){
  return users.find(u => u.username.toLowerCase() === username.toLowerCase());
}

/* SIGNUP */
async function handleSignup(e){
  e.preventDefault();
  const username = document.getElementById("su-username").value.trim();
  if(!username) return alert("Choisis un nom d'utilisateur");
  if(findUserByUsername(username)) return alert("Nom déjà pris");

  const age = document.getElementById("su-age").value;
  const genre = document.querySelector('input[name="su-genre"]:checked')?.value || "autre";
  const recherche = Array.from(document.querySelectorAll('input[name="su-recherche"]:checked')).map(i=>i.value);
  const avatar = document.querySelector("#signup-avatars .avatar-choice.selected")?.src || avatars[0];
  const interets = Array.from(document.querySelectorAll("#signup-interets .interet-btn.selected")).map(b=>b.textContent);
  const password = document.getElementById("su-password").value;
  if(!password) return alert("Choisis un mot de passe");

  const user = {
    id: Date.now() + Math.floor(Math.random()*1000),
    username,
    password, // plain text (ok pour test). For production use hashing on server.
    age,
    genre,
    recherche: recherche.length ? recherche : ["les deux"],
    avatar,
    interets,
    bio: ""
  };
  users.push(user);
  await saveToBin();
  currentUser = user;
  localStorage.setItem("app_username", user.username);
  onLoginSuccess();
}

/* LOGIN */
function handleLogin(e){
  e.preventDefault();
  const username = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value;
  const user = findUserByUsername(username);
  if(!user) return alert("Utilisateur introuvable");
  if(user.password !== password) return alert("Mot de passe incorrect");
  currentUser = user;
  localStorage.setItem("app_username", user.username);
  onLoginSuccess();
}

/* LOGOUT */
function handleLogout(){
  currentUser = null;
  localStorage.removeItem("app_username");
  showPage("page-login");
}

/* ---------- After login (populate UI) ---------- */
function onLoginSuccess(){
  showPage("page-home");
  renderHome();
  renderRecentProfiles();
  renderConversationsList();
}

/* ---------- Render home ---------- */
function renderHome(){
  if(!currentUser) return;
  document.getElementById("home-welcome").textContent = `Bienvenue, ${currentUser.username} !`;
  // home-avatar is an <img>, set src
  const homeAvatar = document.getElementById("home-avatar");
  if(homeAvatar) homeAvatar.src = currentUser.avatar;
  document.getElementById("home-username").textContent = currentUser.username;
  document.getElementById("home-age-gender").textContent = `${currentUser.age} • ${currentUser.genre}`;
  document.getElementById("home-bio").textContent = currentUser.bio || "";
  document.getElementById("home-interests").textContent = (currentUser.interets||[]).length ? "Interêts: " + currentUser.interets.join(", ") : "";
}

/* helper */
function renderHomeIfNeeded(){
  if(currentUser && document.querySelector("#page-home").classList.contains("active")){
    renderHome();
  }
}

/* ---------- Recent profiles list ---------- */
function renderRecentProfiles(){
  const container = document.getElementById("recent-profiles");
  if(!container) return;
  container.innerHTML = "";
  const last = users.slice().reverse().filter(u => u.username !== (currentUser?.username)).slice(0,6);
  last.forEach(u => {
    const div = document.createElement("div");
    div.className = "profile-row";
    div.innerHTML = `<img class="mini-avatar" src="${u.avatar}"><div><strong>${u.username}</strong><div class="mini">${u.age} • ${u.genre}</div></div>`;
    div.addEventListener("click", ()=> openChatWithUser(u.id));
    container.appendChild(div);
  });
}

/* ---------- Matches ---------- */
function computeMatchesFor(user){
  return users.filter(u => {
    if(u.id === user.id) return false;
    const userWants = user.recherche || ["les deux"];
    const otherWants = u.recherche || ["les deux"];
    const userWantsOther = userWants.includes("les deux") || userWants.includes(u.genre) || (userWants.includes("gars") && u.genre==="homme");
    const otherWantsUser = otherWants.includes("les deux") || otherWants.includes(user.genre) || (otherWants.includes("gars") && user.genre==="homme");
    if(!userWantsOther || !otherWantsUser) return false;
    const interU = user.interets || [];
    const interO = u.interets || [];
    const common = interU.filter(i => interO.includes(i));
    return common.length > 0;
  });
}

function renderMatches(){
  const container = document.getElementById("matches-list");
  container.innerHTML = "";
  if(!currentUser) return;
  const matches = computeMatchesFor(currentUser);
  if(matches.length === 0){
    container.innerHTML = "<p>Aucun match pour le moment.</p>";
    return;
  }
  matches.forEach(m => {
    const row = document.createElement("div");
    row.className = "match-row";
    row.innerHTML = `<img class="mini-avatar" src="${m.avatar}"><div><strong>${m.username}</strong><div class="mini">${m.age} • ${m.genre}</div></div>`;
    row.addEventListener("click", ()=> openChatWithUser(m.id));
    container.appendChild(row);
  });
}

/* ---------- Conversations & Chat ---------- */
function renderConversationsList(){
  const container = document.getElementById("conversations-list");
  if(!container || !currentUser) return;
  container.innerHTML = "";
  const convIds = new Set();
  messages.forEach(m => {
    if(m.fromId === currentUser.id) convIds.add(m.toId);
    if(m.toId === currentUser.id) convIds.add(m.fromId);
  });
  computeMatchesFor(currentUser).forEach(u => convIds.add(u.id));
  const ids = Array.from(convIds);
  if(ids.length === 0){
    container.innerHTML = "<p>Aucune conversation — clique sur un profil pour en démarrer.</p>";
    return;
  }
  ids.forEach(id => {
    const u = users.find(x => x.id === id);
    if(!u) return;
    const div = document.createElement("div");
    div.className = "profile-row";
    div.innerHTML = `<img class="mini-avatar" src="${u.avatar}"><div><strong>${u.username}</strong><div class="mini">${u.age} • ${u.genre}</div></div>`;
    div.addEventListener("click", ()=> openChatWithUser(id));
    container.appendChild(div);
  });
}

function openChatWithUser(userId){
  const partner = users.find(u => u.id === userId);
  if(!partner) return alert("Utilisateur introuvable");
  showPage("page-messages");
  document.getElementById("chat-area").classList.remove("hidden");
  document.getElementById("chat-with").textContent = `Conversation avec ${partner.username}`;
  displayChat(partner.id);
  document.getElementById("msg-send").onclick = async () => {
    const input = document.getElementById("msg-input");
    const text = input.value.trim();
    if(!text) return;
    const msg = { fromId: currentUser.id, toId: partner.id, text, timestamp: Date.now() };
    messages.push(msg);
    await saveToBin();
    input.value = "";
    displayChat(partner.id);
    renderConversationsList();
  };
}

function displayChat(withId){
  const box = document.getElementById("messages-box");
  box.innerHTML = "";
  const conv = messages.filter(m => (m.fromId===currentUser.id && m.toId===withId) || (m.fromId===withId && m.toId===currentUser.id));
  conv.sort((a,b)=>a.timestamp - b.timestamp);
  conv.forEach(m => {
    const who = users.find(u => u.id === m.fromId) || { username: "?" };
    const div = document.createElement("div");
    div.textContent = `${who.username}: ${m.text}`;
    box.appendChild(div);
  });
  box.scrollTop = box.scrollHeight;
}

/* ---------- Edit profile ---------- */
function openEdit(){
  if(!currentUser) return;
  showPage("page-edit");
  document.getElementById("edit-bio").value = currentUser.bio || "";
  setTimeout(()=>{ // allow UI to render avatars/interests
    document.querySelectorAll("#edit-avatars .avatar-choice").forEach(img => {
      img.classList.toggle("selected", img.src === currentUser.avatar);
    });
    document.querySelectorAll("#edit-interets .interet-btn").forEach(b => {
      b.classList.toggle("selected", (currentUser.interets || []).includes(b.textContent));
    });
  }, 50);
}

async function saveEdit(e){
  e.preventDefault();
  const bio = document.getElementById("edit-bio").value;
  const selAvatar = document.querySelector("#edit-avatars .avatar-choice.selected")?.src;
  const selInterests = Array.from(document.querySelectorAll("#edit-interets .interet-btn.selected")).map(b=>b.textContent);
  currentUser.bio = bio;
  if(selAvatar) currentUser.avatar = selAvatar;
  currentUser.interets = selInterests;
  const idx = users.findIndex(u => u.id === currentUser.id);
  if(idx >= 0) users[idx] = currentUser;
  await saveToBin();
  renderHome();
  showPage("page-home");
}

/* ---------- UI wiring ---------- */
function wireUI(){
  document.getElementById("login-form").addEventListener("submit", handleLogin);
  document.getElementById("goto-signup").addEventListener("click", ()=> showPage("page-signup"));
  document.getElementById("back-to-login").addEventListener("click", ()=> showPage("page-login"));
  document.getElementById("signup-form").addEventListener("submit", handleSignup);

  document.getElementById("open-edit").addEventListener("click", openEdit);
  document.getElementById("open-matches").addEventListener("click", ()=>{ renderMatches(); showPage("page-matches");});
  document.getElementById("matches-back").addEventListener("click", ()=> showPage("page-home"));
  document.getElementById("open-inbox").addEventListener("click", ()=>{ renderConversationsList(); showPage("page-messages"); });
  document.getElementById("logout-btn").addEventListener("click", handleLogout);

  document.getElementById("edit-form").addEventListener("submit", saveEdit);
  document.getElementById("edit-cancel").addEventListener("click", ()=> showPage("page-home"));

  document.getElementById("inbox-back").addEventListener("click", ()=> showPage("page-home"));
  document.getElementById("close-chat").addEventListener("click", ()=> {
    document.getElementById("chat-area").classList.add("hidden");
    renderConversationsList();
  });
}

/* ---------- INIT ---------- */
async function init(){
  // render avatar & interests UI in all needed containers
  ["signup-avatars","edit-avatars"].forEach(id => generateAvatarChoices(id));
  ["signup-interets","edit-interets"].forEach(id => generateInterestButtons(id));

  wireUI();

  await loadFromBin();

  if(!currentUser) showPage("page-login");

  // polling (keep synced)
  setInterval(async ()=>{
    await loadFromBin();
    if(currentUser){
      renderHomeIfNeeded();
      renderRecentProfiles();
      renderConversationsList();
      // refresh chat if open
      if(!document.getElementById("chat-area").classList.contains("hidden")){
        const chatWithText = document.getElementById("chat-with").textContent.replace("Conversation avec ","");
        const partner = users.find(u => u.username === chatWithText);
        if(partner) displayChat(partner.id);
      }
    }
  }, 3000);
}

window.addEventListener("load", init);
