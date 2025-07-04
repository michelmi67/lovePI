import React, { useEffect, useState } from 'react';

function Profile({ user }) {
  const [bio, setBio] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [photo, setPhoto] = useState("");

  useEffect(() => {
    // Charger le profil depuis le backend
    fetch(`http://localhost:3001/api/profile/${user.username}`)
      .then(res => res.json())
      .then(data => {
        if (data) {
          setBio(data.bio || "");
          setAge(data.age || "");
          setGender(data.gender || "");
          setPhoto(data.photo || "");
        }
      });
  }, [user]);

  const handleSave = async () => {
    const response = await fetch("http://localhost:3001/api/save_profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: user.username,
        bio, age, gender, photo
      })
    });

    const result = await response.json();
    if (result.success) {
      alert("Profil sauvegardé !");
    }
  };

  return (
    <div>
      <h2>Mon Profil</h2>
      <p><strong>Utilisateur Pi :</strong> {user.username}</p>

      <label>Âge :</label>
      <input type="number" value={age} onChange={e => setAge(e.target.value)} /><br />

      <label>Genre :</label>
      <select value={gender} onChange={e => setGender(e.target.value)}>
        <option value="">-- Choisir --</option>
        <option value="femme">Femme</option>
        <option value="homme">Homme</option>
        <option value="autre">Autre</option>
      </select><br />

      <label>Bio :</label><br />
      <textarea value={bio} onChange={e => setBio(e.target.value)} /><br />

      <label>Photo de profil (URL) :</label>
      <input value={photo} onChange={e => setPhoto(e.target.value)} /><br />

      {photo && <img src={photo} alt="Photo de profil" width="100" />}

      <br />
      <button onClick={handleSave}>Sauvegarder</button>
    </div>
  );
}

export default Profile;
