let users=[], currentUser=null, messages=[];
const avatars=["avatar1.png","avatar2.png","avatar3.png","avatar4.png"];
const interetsList=["Musique","Sport","Lecture","Jeux","Films","Voyages"];

function showPage(id){
  document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

function generateAvatars(containerId){
  const container=document.getElementById(containerId);
  container.innerHTML="";
  avatars.forEach(src=>{
    const img=document.createElement("img");
    img.src=src;
    img.classList.add("avatar-choice");
    img.addEventListener("click",()=> {
      document.querySelectorAll(`#${containerId} .avatar-choice`).forEach(a=>a.classList.remove("selected"));
      img.classList.add("selected");
    });
    container.appendChild(img);
  });
}

function generateInterets(containerId){
  const container=document.getElementById(containerId);
  container.innerHTML="";
  interetsList.forEach(int=>{
    const btn=document.createElement("button");
    btn.textContent=int;
    btn.classList.add("interet-btn");
    btn.addEventListener("click",()=>btn.classList.toggle("selected"));
    container.appendChild(btn);
  });
}

document.getElementById("register-form").addEventListener("submit",e=>{
  e.preventDefault();
  const pseudo=document.getElementById("pseudo").value;
  const age=document.getElementById("age").value;
  const genre=document.querySelector('input[name="genre"]:checked')?.value;
  const recherche=Array.from(document.querySelectorAll('input[name="recherche"]:checked')).map(r=>r.value);
  const avatar=document.querySelector("#avatars .avatar-choice.selected")?.src || avatars[0];
  const interets=Array.from(document.querySelectorAll("#interets .interet-btn.selected")).map(b=>b.textContent);

  currentUser={pseudo,age,genre,recherche,avatar,interets,bio:"",id:Date.now()};
  users.push(currentUser);
  showPage("home-page");
  displayHome();
});

function displayHome(){
  if(!currentUser) return;
  document.getElementById("home-avatar").innerHTML=`<img src="${currentUser.avatar}" class="mini-avatar">`;
  document.getElementById("home-pseudo").textContent=`Pseudo : ${currentUser.pseudo}`;
  document.getElementById("home-age").textContent=`Âge : ${currentUser.age}`;
  document.getElementById("home-genre").textContent=`Genre : ${currentUser.genre}`;
  document.getElementById("home-recherche").textContent=`Recherche : ${currentUser.recherche.join(", ")}`;
  document.getElementById("home-bio").textContent=`Bio : ${currentUser.bio}`;
  document.getElementById("home-interets").textContent=`Centres d'intérêt : ${currentUser.interets.join(", ")}`;
}

// INIT
window.onload=()=>{
  generateAvatars("avatars");
  generateAvatars("edit-avatars");
  generateInterets("interets");
  generateInterets("edit-interets");
}
