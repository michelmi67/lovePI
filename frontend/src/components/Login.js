import React from 'react';

function Login({ onLogin }) {
  const handleLogin = async () => {
    const scopes = ['username', 'payments'];
    try {
      const result = await window.Pi.authenticate(scopes, payment => {
        console.log("Paiement en attente :", payment);
      });
      console.log("Utilisateur connecté :", result.user);
      onLogin(result.user);
    } catch (e) {
      console.error("Erreur d'auth Pi :", e);
    }
  };

  return <button onClick={handleLogin}>Connexion avec Pi Network</button>;
}

export default Login;