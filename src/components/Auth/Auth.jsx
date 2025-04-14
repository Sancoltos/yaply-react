import React, { useEffect, useState } from 'react';
import './Auth.css';

const Auth = ({ setCurrentUser }) => {
  const [showSignup, setShowSignup] = useState(false);
  const [avatars, setAvatars] = useState(['default-avatar.png']);
  const [selectedAvatar, setSelectedAvatar] = useState(null);

  useEffect(() => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userAvatar');

    const loadAvatars = async () => {
      try {
        const response = await fetch('/images/avatars/manifest.json');
        if (!response.ok) throw new Error('Failed to load avatars');
        const data = await response.json();
        setAvatars(data.avatars || ['default-avatar.png']);
        setSelectedAvatar(data.avatars[0] || 'default-avatar.png');
      } catch (error) {
        console.log('Using default avatars');
        setAvatars(['default-avatar.png']);
        setSelectedAvatar('default-avatar.png');
      }
    };
    loadAvatars();
  }, []);

  const handleAuth = async (e, isLogin) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    if (!isLogin && !selectedAvatar) {
      return alert('Please select an avatar');
    }

    try {
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://yaply-zecq.onrender.com' 
        : '';
      const endpoint = `${baseUrl}/api${isLogin ? '/login' : '/signup'}`;
      
      console.log('Making request to:', endpoint); // Debug log
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isLogin ? data : { ...data, avatar: selectedAvatar })
      });

      console.log('Response status:', response.status); // Debug log
      
      const result = await response.json();
      
      if (response.ok) {
        localStorage.setItem('currentUser', data.username);
        localStorage.setItem('userAvatar', result.avatar || 'default-avatar.png');
        setCurrentUser(data.username);
      } else {
        alert(result.message || (isLogin ? 'Login failed' : 'Signup failed'));
      }
    } catch (error) {
      console.error('Auth error:', error); // Debug log
      alert('Network error - please try again');
    }
  };

  return (
    <div className="login-container">
      <img src="/images/Screenshot 2024-12-02 121802.png" alt="Logo" className="logo" />
      
      {!showSignup ? (
        <form onSubmit={(e) => handleAuth(e, true)}>
          <h2>Welcome Back!</h2>
          <input name="username" placeholder="Username" required />
          <input name="password" type="password" placeholder="Password" required />
          <button type="submit">Login</button>
          <p>
            Don't have an account?{' '}
            <button 
              type="button" 
              className="auth-toggle"
              onClick={() => {
                setShowSignup(true);
                window.scrollTo({
                  top: document.documentElement.scrollHeight,
                  behavior: 'smooth'
                });
              }}
            >
              Sign Up
            </button>
          </p>
        </form>
      ) : (
        <form onSubmit={(e) => handleAuth(e, false)}>
          <h2>Create Account</h2>
          <input name="username" placeholder="Username" required />
          <input name="password" type="password" placeholder="Password" required />
          <div className="avatar-selection">
            <h3>Choose Avatar</h3>
            <div className="avatar-grid">
              {avatars.map(avatar => (
                <img
                key={avatar}
                src={`/images/avatars/${avatar}`}
                className={`avatar-option ${selectedAvatar === avatar ? 'selected' : ''}`}
                onClick={() => setSelectedAvatar(avatar)}
                alt="Avatar"
                loading="lazy"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/images/default-avatar.png';
                }}
              />
              ))}
            </div>
          </div>
          <button type="submit">Sign Up</button>
          <p>
            Already have an account?{' '}
            <button 
              type="button" 
              className="auth-toggle"
              onClick={() => {
                setShowSignup(false);
                window.scrollTo({
                  top: 0,
                  behavior: 'smooth'
                });
              }}
            >
              Login
            </button>
          </p>
        </form>
      )}
    </div>
  );
};

export default Auth;