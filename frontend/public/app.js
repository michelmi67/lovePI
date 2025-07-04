// app.js
// =========
// Single master script for all pages (index, profile, explore, matches, chat)

///////////////////////////////////////////
// CONFIGURATION
///////////////////////////////////////////
const API_BASE_URL = window.__ENV.backendURL;

///////////////////////////////////////////
// GLOBAL STATE
///////////////////////////////////////////
let currentUser = null;
let otherProfiles = [];
let currentIndex = 0;
let socket = null;

///////////////////////////////////////////
// BOOTSTRAP: Authenticate & route
///////////////////////////////////////////
window.onload = () => {
  // Ensure Pi Browser SDK is available
  if (!window.Pi) {
    alert("⚠️ Veuillez ouvrir cette page dans Pi Browser.");
    return;
  }

  // Authenticate automatically in sandbox
  window.Pi.authenticate(
    ['username'],
    { sandbox: true },
    async auth => {
      currentUser = auth.user.username;
      const path = window.location.pathname.toLowerCase();

      if (path.endsWith("index.html") || path.endsWith("/") || path === "") {
        // INDEX PAGE: check profile and redirect
        // --------------------------------------
        // Check if user has a profile
        try {
          const resp = await fetch(`${API_BASE_URL}/api/profile/${currentUser}`);
          const data = await resp.json();
          if (!data.bio) {
            window.location.href = "profile.html";
          } else {
            window.location.href = "explore.html";
          }
        } catch (e) {
          console.error("Backend error:", e);
          document.body.innerHTML += "<p style='color:red;'>Erreur de connexion au backend.</p>";
        }
      }
      else if (path.endsWith("profile.html")) {
        initProfilePage();
      }
      else if (path.endsWith("explore.html")) {
        initExplorePage();
      }
      else if (path.endsWith("matches.html")) {
        initMatchesPage();
      }
      else if (path.endsWith("chat.html")) {
        initChatPage();
      }
      else {
        console.warn("No init for this path:", path);
      }
    }
  );
};

///////////////////////////////////////////
// PROFILE PAGE
///////////////////////////////////////////
function initProfilePage() {
  document.getElementById("username").textContent = currentUser;

  // Photo input → preview
  const photoInput = document.getElementById("photoInput");
  const previewImg = document.getElementById("preview");
  photoInput.addEventListener("change", function () {
    const file = this.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      previewImg.src = e.target.result;
      previewImg.style.display = "block";
      window.base64Photo = e.target.result;
    };
    reader.readAsDataURL(file);
  });

  // Load profile data
  fetch(`${API_BASE_URL}/api/profile/${currentUser}`)
    .then(r => r.json())
    .then(data => {
      document.getElementById("age").value    = data.age    || "";
      document.getElementById("gender").value = data.gender || "";
      document.getElementById("bio").value    = data.bio    || "";
      if (data.photo) {
        previewImg.src = data.photo;
        previewImg.style.display = "block";
        window.base64Photo = data.photo;
      }
    });

  // Save button
  document.getElementById("saveProfileBtn").onclick = async () => {
    const age    = document.getElementById("age").value;
    const gender = document.getElementById("gender").value;
    const bio    = document.getElementById("bio").value;
    const photo  = window.base64Photo || "";

    const res = await fetch(`${API_BASE_URL}/api/save_profile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: currentUser, age, gender, bio, photo })
    });
    if (res.ok) {
      alert("✅ Profil enregistré ! Redirection vers Explore…");
      window.location.href = "explore.html";
    } else {
      alert("❌ Échec de l'enregistrement.");
    }
  };
}

///////////////////////////////////////////
// EXPLORE PAGE
///////////////////////////////////////////
async function initExplorePage() {
  // Fetch all profiles
  const resAll = await fetch(`${API_BASE_URL}/api/all_profiles`);
  const all = await resAll.json();
  otherProfiles = Object.entries(all)
    .filter(([u]) => u !== currentUser)
    .map(([u, d]) => ({ username: u, ...d }));

  // Navigation buttons
  const btnContainer = document.querySelector(".buttons");
  btnContainer.innerHTML = `
    <button id="likeBtn">❤️ Like</button>
    <button id="skipBtn">➡️ Skip</button>
    <button id="matchesBtn">💘 My Matches</button>
    <button id="chatsBtn">💬 My Chats</button>
  `;
  document.getElementById("likeBtn").onclick    = likeProfile;
  document.getElementById("skipBtn").onclick    = skipProfile;
  document.getElementById("matchesBtn").onclick = () => window.location.href="matches.html";
  document.getElementById("chatsBtn").onclick   = () => window.location.href="chat-list.html";

  showNextProfile();
}

function showNextProfile() {
  if (currentIndex >= otherProfiles.length) {
    document.getElementById("profile-container").innerHTML = "<p>Plus de profils.</p>";
    return;
  }
  const p = otherProfiles[currentIndex];
  document.getElementById("username").textContent = p.username;
  document.getElementById("age").textContent      = p.age    || "N/A";
  document.getElementById("gender").textContent   = p.gender || "N/A";
  document.getElementById("bio").textContent      = p.bio    || "N/A";
  const photoEl = document.getElementById("photo");
  if (p.photo) {
    photoEl.src = p.photo;
    photoEl.style.display = "block";
  } else {
    photoEl.style.display = "none";
  }
}

async function likeProfile() {
  const p = otherProfiles[currentIndex];
  if (!p) return;
  const res = await fetch(`${API_BASE_URL}/api/like`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ from: currentUser, to: p.username })
  });
  const { match } = await res.json();
  alert(match ? `🎉 C'est un match avec ${p.username} !` : `Vous avez liké ${p.username}`);
  currentIndex++;
  showNextProfile();
}

function skipProfile() {
  currentIndex++;
  showNextProfile();
}

///////////////////////////////////////////
// MATCHES PAGE
///////////////////////////////////////////
async function initMatchesPage() {
  const res = await fetch(`${API_BASE_URL}/api/matches/${currentUser}`);
  const matches = await res.json();
  const listDiv = document.getElementById("matches-list");
  listDiv.innerHTML = "";

  if (!matches.length) {
    listDiv.innerHTML = "<p>Vous n'avez pas encore de matchs.</p>";
    return;
  }

  matches.forEach(u => {
    const card = document.createElement("div");
    card.className = "match-card";
    card.innerHTML = `
      <strong>${u}</strong><br>
      <button class="chatBtn">💬 Chat</button>
    `;
    card.querySelector(".chatBtn").onclick = () => 
      window.location.href = `chat.html?with=${u}`;
    listDiv.appendChild(card);
  });
}

///////////////////////////////////////////
// CHAT PAGE
///////////////////////////////////////////
function initChatPage() {
  socket = io(API_BASE_URL);
  const params = new URLSearchParams(window.location.search);
  const target = params.get("with");
  document.getElementById("chatWith").textContent = target;
  socket.emit("join", { username: currentUser });

  socket.on("private_message", ({ from, text }) => {
    const div = document.createElement("div");
    div.textContent = `${from}: ${text}`;
    document.getElementById("messages").appendChild(div);
    scrollToBottom();
  });

  document.getElementById("sendBtn").onclick = () => {
    const input = document.getElementById("msgInput");
    const text = input.value.trim();
    if (!text) return;
    socket.emit("private_message", { from: currentUser, to: target, text });
    const div = document.createElement("div");
    div.textContent = `You: ${text}`;
    document.getElementById("messages").appendChild(div);
    input.value = "";
    scrollToBottom();
  };
}

function scrollToBottom() {
  const c = document.getElementById("messages");
  c.scrollTop = c.scrollHeight;
}
