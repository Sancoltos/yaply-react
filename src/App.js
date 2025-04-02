import React, { useState, useEffect } from 'react';
import Auth from './components/Auth/Auth';
import Chat from './components/Chat/Chat';
import './App.css';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUi, setShowUi] = useState(false); // New state for UI synchronization

  useEffect(() => {
    const verifyAuth = async () => {
      const storedUser = localStorage.getItem('currentUser');
      const storedAvatar = localStorage.getItem('userAvatar');
      
      if (storedUser && storedAvatar) {
        setCurrentUser(storedUser);
      } else {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('userAvatar');
        setCurrentUser(null);
      }
      
      // Wait for all elements to be ready before showing UI
      setTimeout(() => {
        setLoading(false);
        setShowUi(true);
      }, 50);
    };
    verifyAuth();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userAvatar');
    setCurrentUser(null);
  };

  if (loading) {
    return <div className="app-loading">Loading...</div>;
  }

  return (
    <div className={`app-container ${showUi ? 'visible' : ''}`}>
      {currentUser ? (
        <Chat currentUser={currentUser} onLogout={handleLogout} />
      ) : (
        <Auth setCurrentUser={setCurrentUser} />
      )}
    </div>
  );
}

export default App;