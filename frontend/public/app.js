// app.js
// =========
// Master script for all Pi Love pages:
// • profile.html
// • explore.html
// • matches.html
// • chat.html
//
// Requirements:
// - Include <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script> BEFORE this file on chat.html
// - In each HTML <head>, add:
//     <script> window.__PI_SANDBOX__ = true; </script>
// - Deploy your backend to Render and set API_BASE_URL accordingly.

///////////////////////////////////////////
// CONFIGURATION
///////////////////////////////////////////
const API_BASE_URL = "https://lovepi-backend.onrender.com";  
// ← replace this if your backend URL differs

///////////////////////////////////////////
// GLOBAL STATE
///////////////////////////////////////////
let currentUser = null;    // Pi username after authenticate
let otherProfiles = [];    // for explore.html
let currentIndex = 0;      // profile index for explore.html
let socket = null;         // Socket.IO client (for chat.html)

///////////////////////////////////////////
// BOOTSTRAP: Authenticate user & dispatch
///////////////////////////////////////////
window.onload = () => {
  // 1. Ensure Pi Browser SDK is available
  if (!window.Pi) {
    alert("⚠️ Please open this page in Pi Browser.");
    return;
  }

  // 2. Authenticate automatically in sandbox mode
  window.Pi.authenticate(
    ['username'],            // we only need the username scope
    { sandbox: true },       // enable testnet/sandbox mode
    async function(auth) {
      // 3. Retrieve authenticated username
      currentUser = auth.user.username;

      // 4. Determine which page we’re on and init
      const path = window.location.pathname.toLowerCase();

      if (path.endsWith("profile.html")) {
        initProfilePage();
      } else if (path.endsWith("explore.html") || path.endsWith("/")) {
        initExplorePage();
      } else if (path.endsWith("matches.html")) {
        initMatchesPage();
      } else if (path.endsWith("chat.html")) {
        initChatPage();
      } else {
        console.warn("No init function for path:", path);
      }
    }
  );
};


///////////////////////////////////////////
// 1. PROFILE PAGE (profile.html)
///////////////////////////////////////////
function initProfilePage() {
  // Show username in the header
  document.getElementById("username").textContent = currentUser;

  // Wire up photo input → base64 preview
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

  // Load existing profile data
  fetch(`${API_BASE_URL}/api/profile/${currentUser}`)
    .then(r => r.json())
    .then(data => {
      document.getElementById("age").value = data.age || "";
      document.getElementById("gender").value = data.gender || "";
      document.getElementById("bio").value = data.bio || "";
      if (data.photo) {
        previewImg.src = data.photo;
        previewImg.style.display = "block";
        window.base64Photo = data.photo;
      }
    })
    .catch(err => console.error("Failed to load profile:", err));

  // Hook up Save button
  document.getElementById("saveProfileBtn").addEventListener("click", async () => {
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
      alert("✅ Profile saved! Redirecting to Explore…");
      window.location.href = "explore.html";
    } else {
      alert("❌ Failed to save profile.");
    }
  });
}


///////////////////////////////////////////
// 2. EXPLORE PAGE (explore.html)
///////////////////////////////////////////
async function initExplorePage() {
  // Fetch all profiles, exclude current
  const resAll = await fetch(`${API_BASE_URL}/api/all_profiles`);
  const all = await resAll.json();
  otherProfiles = Object.entries(all)
    .filter(([user]) => user !== currentUser)
    .map(([user, data]) => ({ username: user, ...data }));

  // Insert nav buttons
  const btnContainer = document.querySelector(".buttons");
  btnContainer.innerHTML = `
    <button id="likeBtn">❤️ Like</button>
    <button id="skipBtn">➡️ Skip</button>
    <button id="matchesBtn">💘 My Matches</button>
    <button id="chatsBtn">💬 My Chats</button>
  `;
  document.getElementById("likeBtn").onclick   = likeProfile;
  document.getElementById("skipBtn").onclick   = skipProfile;
  document.getElementById("matchesBtn").onclick= () => window.location.href="matches.html";
  document.getElementById("chatsBtn").onclick  = () => window.location.href="chat-list.html";

  // Show the first profile
  showNextProfile();
}

function showNextProfile() {
  // If no more, display a message
  if (currentIndex >= otherProfiles.length) {
    document.getElementById("profile-container")
      .innerHTML = "<p>No more profiles to explore!</p>";
    return;
  }

  // Populate fields
  const p = otherProfiles[currentIndex];
  document.getElementById("username").textContent = p.username;
  document.getElementById("age").textContent      = p.age || "N/A";
  document.getElementById("gender").textContent   = p.gender || "N/A";
  document.getElementById("bio").textContent      = p.bio || "N/A";
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
  alert(match 
    ? `🎉 It's a match with ${p.username}!`
    : `You liked ${p.username}`);
  currentIndex++;
  showNextProfile();
}

function skipProfile() {
  currentIndex++;
  showNextProfile();
}


///////////////////////////////////////////
// 3. MATCHES PAGE (matches.html)
///////////////////////////////////////////
async function initMatchesPage() {
  const res = await fetch(`${API_BASE_URL}/api/matches/${currentUser}`);
  const matches = await res.json();
  const listDiv = document.getElementById("matches-list");
  listDiv.innerHTML = "";

  if (!matches.length) {
    listDiv.innerHTML = "<p>You have no matches yet.</p>";
    return;
  }

  matches.forEach(username => {
    const card = document.createElement("div");
    card.className = "match-card";
    card.innerHTML = `
      <strong>${username}</strong><br>
      <button class="chatBtn">💬 Chat</button>
    `;
    card.querySelector(".chatBtn")
      .onclick = () => window.location.href = `chat.html?with=${username}`;
    listDiv.appendChild(card);
  });
}


///////////////////////////////////////////
// 4. CHAT PAGE (chat.html)
///////////////////////////////////////////
function initChatPage() {
  // Set up Socket.IO client
  socket = io(API_BASE_URL);
  const urlParams = new URLSearchParams(window.location.search);
  const targetUser = urlParams.get("with");

  // Display chat partner
  document.getElementById("chatWith").textContent = targetUser;

  // Join our own room
  socket.emit("join", { username: currentUser });

  // Listen for incoming private messages
  socket.on("private_message", ({ from, text }) => {
    const div = document.createElement("div");
    div.textContent = `${from}: ${text}`;
    document.getElementById("messages").appendChild(div);
    scrollToBottom();
  });

  // Hook up Send button
  document.getElementById("sendBtn").onclick = () => {
    const input = document.getElementById("msgInput");
    const text = input.value.trim();
    if (!text) return;
    // Emit over WebSocket
    socket.emit("private_message", {
      from: currentUser,
      to:   targetUser,
      text
    });
    // Append locally too
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
