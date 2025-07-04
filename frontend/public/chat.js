// chat.js
window.__PI_SANDBOX__ = true;

const targetUser = new URLSearchParams(window.location.search).get("with");
let currentUser = null;

// connecte-toi à ton backend Render Socket.IO
const socket = io("https://lovepi-backend.onrender.com");

window.onload = () => {
  if (!window.Pi) {
    alert("Please open this in Pi Browser.");
    return;
  }
  if (!targetUser) {
    alert("No user selected for chat.");
    return;
  }
  document.getElementById("chatWith").textContent = targetUser;

  window.Pi.authenticate(['username'], function (auth) {
    currentUser = auth.user.username;
    socket.emit("join", { username: currentUser });
  });
};

socket.on("private_message", ({ from, text }) => {
  const div = document.createElement("div");
  div.textContent = `${from}: ${text}`;
  document.getElementById("messages").appendChild(div);
  scrollToBottom();
});

function sendMessage() {
  const input = document.getElementById("msgInput");
  const text = input.value.trim();
  if (!text || !currentUser) return;
  socket.emit("private_message", { from: currentUser, to: targetUser, text });
  const div = document.createElement("div");
  div.textContent = `You: ${text}`;
  document.getElementById("messages").appendChild(div);
  input.value = "";
  scrollToBottom();
}

function scrollToBottom() {
  const container = document.getElementById("messages");
  container.scrollTop = container.scrollHeight;
}
