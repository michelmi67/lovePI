// explore.js
window.__PI_SANDBOX__ = true;

let currentUser = null;
let otherProfiles = [];
let currentIndex = 0;

window.onload = async () => {
  if (!window.Pi) {
    alert("This page must be opened in Pi Browser.");
    return;
  }

  window.Pi.authenticate(['username'], async function (auth) {
    currentUser = auth.user.username;

    // Charge tous les profils depuis le backend Render
    const res = await fetch("https://lovepi-backend.onrender.com/api/all_profiles");
    const all = await res.json();

    // Exclut l'utilisateur courant
    otherProfiles = Object.entries(all)
      .filter(([username]) => username !== currentUser)
      .map(([username, data]) => ({ username, ...data }));

    showNextProfile();
  });
};

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

  const res = await fetch("https://lovepi-backend.onrender.com/api/like", {
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
  currentIndex++;
  showNextProfile();
}
