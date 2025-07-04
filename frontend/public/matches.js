// matches.js
window.__PI_SANDBOX__ = true;

let currentUser = null;

window.onload = async () => {
  if (!window.Pi) {
    alert("Please open this in Pi Browser.");
    return;
  }

  window.Pi.authenticate(['username'], async function (auth) {
    currentUser = auth.user.username;
    loadMatches();
  });
};

async function loadMatches() {
  const res = await fetch(`https://lovepi-backend.onrender.com/api/matches/${currentUser}`);
  const matches = await res.json();

  const list = document.getElementById("matches-list");
  list.innerHTML = "";

  if (!matches || matches.length === 0) {
    list.innerHTML = "<p>You have no matches yet.</p>";
    return;
  }

  matches.forEach(match => {
    const div = document.createElement("div");
    div.className = "match-card";
    div.innerHTML = `
      <strong>${match}</strong><br>
    `;
    // Optionally fetch full profile if needed, or use /api/all_profiles
    const chatBtn = document.createElement("button");
    chatBtn.textContent = "💬 Chat";
    chatBtn.onclick = () => window.location.href = `chat.html?with=${match}`;
    div.appendChild(chatBtn);
    list.appendChild(div);
  });
}
