let username = null;

window.addEventListener("load", () => {
  if (!window.Pi) {
    alert("You must use Pi Browser!");
    return;
  }

  window.Pi.authenticate(['username'],{ sandbox: true }, function (auth) {
    username = auth.user.username;
    document.getElementById("username").textContent = username;
    loadProfile();
  });

  // Prévisualisation de l'image
  document.getElementById("photoInput").addEventListener("change", function () {
    const file = this.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
      const preview = document.getElementById("preview");
      preview.src = e.target.result;
      preview.style.display = "block";

      // Stocker la photo encodée
      window.base64Photo = e.target.result;
    };
    reader.readAsDataURL(file);
  });
});

function loadProfile() {
  fetch(`http://77.132.100.12/api/profile/${username}`)
    .then(res => res.json())
    .then(data => {
      document.getElementById("bio").value = data.bio || "";
      document.getElementById("age").value = data.age || "";
      document.getElementById("gender").value = data.gender || "";

      if (data.photo) {
        const preview = document.getElementById("preview");
        preview.src = data.photo;
        preview.style.display = "block";
        window.base64Photo = data.photo;
      }
    });
}

async function submitProfile() {
  const age = document.getElementById("age").value;
  const gender = document.getElementById("gender").value;
  const bio = document.getElementById("bio").value;
  const photo = window.base64Photo || "";

  const res = await fetch("http://77.132.100.12/api/profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username,
      age,
      gender,
      bio,
      photo
    })
  });

  if (res.ok) {
    alert("✅ Profile saved!");
    window.location.href = "explore.html";
  } else {
    alert("❌ Failed to save profile.");
  }
}
