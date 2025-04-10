import React, { useState, useEffect } from 'react';
import Auth from './components/Auth/Auth';
import Chat from './components/Chat/Chat';
import './App.css';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUi, setShowUi] = useState(false);

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
      
      // Check if this is the first visit
      const hasVisited = localStorage.getItem('hasVisited');
      const isFirstVisit = !hasVisited;
      if (isFirstVisit) {
        localStorage.setItem('hasVisited', 'true');
      }

      // Use different timing based on first visit
      setTimeout(() => {
        setLoading(false);
        setTimeout(() => {
          setShowUi(true);
        }, 100);
      }, isFirstVisit ? 1000 : 200);
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