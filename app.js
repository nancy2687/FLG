document.getElementById("register-form").addEventListener("submit", function(e) {
  e.preventDefault(); // bloque le reload
  const pseudo = document.getElementById("pseudo").value;
  document.getElementById("message").textContent = "Bienvenue " + pseudo + " !";
});
