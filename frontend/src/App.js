import React, { useState } from 'react';
import Login from './components/Login';
import Profile from './components/Profile';
import Match from './components/Match';
import Donate from './components/Donate';

function App() {
  const [user, setUser] = useState(null);

  return (
    <div>
      <h1>Bienvenue sur PiLove ❤️</h1>
      {!user ? (
        <Login onLogin={setUser} />
      ) : (
        <>
          <Profile user={user} />
          <Match user={user} />
          <Donate />
        </>
      )}
    </div>
  );
}

export default App;