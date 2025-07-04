window.onload = async () => {
  if (!window.Pi) {
    alert("This page must be opened in Pi Browser.");
    return;
  }

  window.Pi.authenticate(['username'],{ sandbox: true }, async function (auth) {
    const currentUser = auth.user.username;
    const matchRes = await fetch(`http://77.132.100.12/api/matches/${currentUser}`);
    const matchList = await matchRes.json(); // array of usernames

    const profileRes = await fetch("http://l77.132.100.12/api/all_profiles");
    const allProfiles = await profileRes.json();

    const listDiv = document.getElementById("matches-list");
    listDiv.innerHTML = ""; // Clear loading

    if (matchList.length === 0) {
      listDiv.innerHTML = "<p>You have no matches yet 😢</p>";
      return;
    }

    matchList.forEach(username => {
      const p = allProfiles[username];
      if (!p) return;

      const card = document.createElement("div");
      card.className = "match-card";

      const img = document.createElement("img");
      img.src = p.photo || "https://via.placeholder.com/80";
      card.appendChild(img);

      const info = document.createElement("div");
      info.className = "match-info";
      info.innerHTML = `
        <strong>${username}</strong><br>
        Age: ${p.age || "?"}<br>
        Gender: ${p.gender || "?"}<br>
        <em>${p.bio || ""}</em><br>
        <button onclick="window.location.href='chat.html?with=${username}'">💬 Chat</button>
      `;
      card.appendChild(info);

      listDiv.appendChild(card);
    });
  });
};
