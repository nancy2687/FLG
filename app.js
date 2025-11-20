// ===== app.js =====

let users = []; 
let currentUser = null; 
let messagesHistory = {}; 
let selectedAvatar = "";
let unreadMessages = {}; // compteur messages non lus

// Éléments
const form = document.getElementById('profileForm');
const matchesDiv = document.getElementById('matches');
const modal = document.getElementById('modal');
const modalBody = document.getElementById('modal-body');
const closeBtn = document.getElementById('close');
const editHomeBtn = document.getElementById('editHome');
const goMessagesBtn = document.getElementById('goMessages');
const userActionsDiv = document.getElementById('userActions');

// Gestion avatars
document.querySelectorAll('.avatar.selectable').forEach(img => {
  img.addEventListener('click', () => {
    document.querySelectorAll('.avatar.selectable').forEach(i => i.classList.remove('selected'));
    img.classList.add('selected');
    selectedAvatar = img.dataset.avatar;
  });
});

// Score compatibilité
function matchScore(u1, u2) {
  const commun = u1.interets.filter(i => u2.interets.includes(i));
  return commun.length;
}

// Vérifier préférences genre
function compatibleGenre(current, other){
  const cherche = current.cherche;
  if(cherche === "les deux") return true;
  if(cherche === "fille" && other.genre==="femme") return true;
  if(cherche === "gars" && other.genre==="homme") return true;
  return false;
}

// Afficher modal et chat
function showModal(user) {
  modalBody.innerHTML = `
    <h3>${user.prenom}</h3>
    <img src="${user.avatar}" class="avatar" style="width:80px;height:80px;">
    <p>Âge : ${user.age}</p>
    <p>Genre : ${user.genre}</p>
    <p>Bio : ${user.bio || "Aucune bio"}</p>
    <p>Centres d'intérêt : ${user.interets.join(', ')}</p>
    <button id="chatBtn">Parler avec ${user.prenom}</button>
    <div id="chatBox" style="display:none;">
      <div id="messages"></div>
      <input type="text" id="msgInput" placeholder="Écris un message...">
      <button id="sendMsg">Envoyer</button>
    </div>
  `;
  modal.style.display = 'block';

  // Chat
  const chatBtn = document.getElementById('chatBtn');
  const chatBox = document.getElementById('chatBox');
  const messagesDiv = document.getElementById('messages');
  const msgInput = document.getElementById('msgInput');
  const sendMsg = document.getElementById('sendMsg');

  // Initialisation historique
  if(!messagesHistory[currentUser.prenom]) messagesHistory[currentUser.prenom] = {};
  if(!messagesHistory[currentUser.prenom][user.prenom]) messagesHistory[currentUser.prenom][user.prenom] = [];
  if(!messagesHistory[user.prenom]) messagesHistory[user.prenom] = {};
  if(!messagesHistory[user.prenom][currentUser.prenom]) messagesHistory[user.prenom][currentUser.prenom] = [];

  const updateChat = () => {
    messagesDiv.innerHTML = messagesHistory[currentUser.prenom][user.prenom].map(m => `<p>${m}</p>`).join('');
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  };

  updateChat();

  chatBtn.onclick = () => {
    chatBox.style.display = 'block';
    // Les messages sont lus, on supprime notification
    unreadMessages[user.prenom] = 0;
    updateUnreadBadge();
  };

  sendMsg.onclick = () => {
    const text = msgInput.value.trim();
    if(text){
      const msg = `Moi: ${text}`;
      messagesHistory[currentUser.prenom][user.prenom].push(msg);
      // Ajouter dans l'historique de l'autre utilisateur
      const replyMsg = `${currentUser.prenom}: ${text}`;
      messagesHistory[user.prenom][currentUser.prenom].push(replyMsg);
      unreadMessages[user.prenom] = (unreadMessages[user.prenom] || 0) + 1;

      const p = document.createElement('p');
      p.textContent = msg;
      messagesDiv.appendChild(p);
      msgInput.value = '';
      messagesDiv.scrollTop = messagesDiv.scrollHeight;

      updateUnreadBadge();
    }
  };
}

// Fermer modal
closeBtn.onclick = () => modal.style.display = 'none';
window.onclick = e => { if(e.target === modal) modal.style.display = 'none'; };

// Afficher matchs compatibles
function displayMatches() {
  matchesDiv.innerHTML = '';
  if(users.length < 2) {
    matchesDiv.textContent = "Pas assez de profils pour matcher.";
    return;
  }

  const others = users.filter(u => u !== currentUser && compatibleGenre(currentUser,u));

  others
    .map(u => ({ user: u, score: matchScore(currentUser, u) }))
    .sort((a,b)=>b.score-a.score)
    .forEach(obj => {
      const div = document.createElement('div');
      const info = document.createElement('span');
      info.innerHTML = `<img src="${obj.user.avatar}" class="avatar" style="width:40px;height:40px;margin-right:5px;"> ${obj.user.prenom} - ${obj.user.interets.join(', ')}`;
      const score = document.createElement('span');
      score.textContent = `Match: ${obj.score}`;
      score.classList.add('match-score');
      div.appendChild(info);
      div.appendChild(score);
      if(obj.score===0) div.style.opacity="0.5";
      div.addEventListener('click',()=>showModal(obj.user));
      matchesDiv.appendChild(div);
    });
}

// Afficher badge messages non lus
function updateUnreadBadge(){
  const totalUnread = Object.values(unreadMessages).reduce((a,b)=>a+b,0);
  goMessagesBtn.textContent = totalUnread>0 ? `Messages (${totalUnread})` : 'Messages';
}

// Créer / modifier profil
form.addEventListener('submit', e=>{
  e.preventDefault();
  const prenom = document.getElementById('prenom').value;
  const age = document.getElementById('age').value;
  const bio = document.getElementById('bio').value;
  const interets = Array.from(form.querySelectorAll('input[type=checkbox]:checked')).map(cb=>cb.value);
  const genre = form.querySelector('input[name="genre"]:checked')?.value;
  const cherche = form.querySelector('input[name="cherche"]:checked')?.value;

  const profil = { prenom, age, bio, interets, avatar: selectedAvatar || "avatar1.png", genre, cherche };
  
  // Remplacer si modification
  if(currentUser){
    users = users.filter(u=>u!==currentUser);
  }
  users.push(profil);
  currentUser = profil;

  form.style.display='none';
  userActionsDiv.style.display='block';
  displayMatches();
  updateUnreadBadge();
});

// Bouton modifier depuis accueil
editHomeBtn.onclick = ()=>{
  form.style.display='block';
  document.getElementById('prenom').value=currentUser.prenom;
  document.getElementById('age').value=currentUser.age;
  document.getElementById('bio').value=currentUser.bio;
  form.querySelectorAll('input[type=checkbox]').forEach(cb=>cb.checked=currentUser.interets.includes(cb.value));
  document.querySelector(`input[name="genre"][value="${currentUser.genre}"]`).checked = true;
  document.querySelector(`input[name="cherche"][value="${currentUser.cherche}"]`).checked = true;
  selectedAvatar = currentUser.avatar;
  document.querySelectorAll('.avatar.selectable').forEach(img=>img.classList.remove('selected'));
  document.querySelector(`.avatar.selectable[data-avatar="${selectedAvatar}"]`)?.classList.add('selected');
  matchesDiv.innerHTML='';
};

// Bouton accès rapide messages
goMessagesBtn.onclick=()=>{
  alert("Clique sur le profil d'une amie pour accéder au chat !");
  // On peut l'améliorer plus tard pour ouvrir une liste des chats
};
