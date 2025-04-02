import React, { useState } from 'react';
import Auth from './components/Auth/Auth';
import Chat from './components/Chat/Chat';
import './App.css'; // This will be minimal - most styles are in component CSS files

function App() {
  const [currentUser, setCurrentUser] = useState(
    localStorage.getItem('currentUser')
  );

  return (
    <div className="app-container">
      {currentUser ? (
        <Chat currentUser={currentUser} />
      ) : (
        <Auth setCurrentUser={setCurrentUser} />
      )}
    </div>
  );
}

export default App;