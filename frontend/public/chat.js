let currentUser = null;
const targetUser = new URLSearchParams(window.location.search).get("with");

const socket = io("http://77.132.100.12");

window.onload = () => {
  if (!window.Pi) {
    alert("This page must be opened in Pi Browser.");
    return;
  }

  if (!targetUser) {
    alert("No user selected for chat.");
    return;
  }

  document.getElementById("chatWith").textContent = targetUser;

  window.Pi.authenticate(['username'],{ sandbox: true }, function (auth) {
    currentUser = auth.user.username;
    socket.emit("join", { username: currentUser });
  });
};

// Réception d’un message privé
socket.on("private_message", ({ from, text }) => {
  const div = document.createElement("div");
  div.className = from === currentUser ? "mine" : "their";
  div.textContent = `${from}: ${text}`;
  document.getElementById("messages").appendChild(div);
  scrollToBottom();
});

// Envoi d’un message
function sendMessage() {
  const input = document.getElementById("msgInput");
  const text = input.value.trim();
  if (!text || !currentUser) return;

  socket.emit("private_message", {
    from: currentUser,
    to: targetUser,
    text
  });

  const div = document.createElement("div");
  div.className = "mine";
  div.textContent = `You: ${text}`;
  document.getElementById("messages").appendChild(div);

  input.value = "";
  scrollToBottom();
}

function scrollToBottom() {
  const container = document.getElementById("messages");
  container.scrollTop = container.scrollHeight;
}
