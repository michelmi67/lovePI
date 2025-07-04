let currentUser = null;
let otherProfiles = [];
let currentIndex = 0;

window.onload = async () => {
  if (!window.Pi) {
    alert("This page must be opened in Pi Browser.");
    return;
  }

  window.Pi.authenticate(['username'],{ sandbox: true }, async function (auth) {
    currentUser = auth.user.username;

    // Charger tous les profils
    const res = await fetch("http://77.132.100.12/api/all_profiles");
    const all = await res.json();

    // Vérifier si l'utilisateur a un profil
    if (!all[currentUser]) {
      // Redirection si le profil n'existe pas
      window.location.href = "profile.html";
      return;
    }

    // Ajouter les boutons "Mes matchs" et "Mes chats"
    addNavigationButtons();

    // Filtrer tous les autres profils
    otherProfiles = Object.entries(all)
      .filter(([username]) => username !== currentUser)
      .map(([username, data]) => ({ username, ...data }));

    showNextProfile();
  });
};

function addNavigationButtons() {
  const container = document.querySelector(".container");

  const navDiv = document.createElement("div");
  navDiv.style.marginBottom = "20px";

  const matchBtn = document.createElement("button");
  matchBtn.textContent = "💘 My Matches";
  matchBtn.onclick = () => window.location.href = "matches.html";

  const chatBtn = document.createElement("button");
  chatBtn.textContent = "💬 My Chats";
  chatBtn.onclick = () => window.location.href = "chat-list.html";

  matchBtn.style.marginRight = "10px";

  navDiv.appendChild(matchBtn);
  navDiv.appendChild(chatBtn);
  container.prepend(navDiv);
}

function showNextProfile() {
  const profile = otherProfiles[currentIndex];
  if (!profile) {
    document.getElementById("profile-container").innerHTML = "<p>No more profiles to explore!</p>";
    return;
  }

  document.getElementById("username").textContent = profile.username;
  document.getElementById("age").textContent = profile.age || "N/A";
  document.getElementById("gender").textContent = profile.gender || "N/A";
  document.getElementById("bio").textContent = profile.bio || "N/A";

  const photo = document.getElementById("photo");
  if (profile.photo) {
    photo.src = profile.photo;
    photo.style.display = "block";
  } else {
    photo.style.display = "none";
  }
}

async function likeProfile() {
  const likedUser = otherProfiles[currentIndex].username;

  const res = await fetch("http://77.132.100.12/api/like", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ from: currentUser, to: likedUser })
  });

  const result = await res.json();

  if (result.match) {
    alert("🎉 It's a match with " + likedUser + "!");
  } else {
    alert("You liked " + likedUser);
  }

  currentIndex++;
  showNextProfile();
}

function skipProfile() {
  if (currentIndex >= otherProfiles.length) return;
  currentIndex++;
  showNextProfile();
}
