import React, { useEffect, useState } from 'react';
import './Auth.css';

const Auth = ({ setCurrentUser }) => {
    const [showSignup, setShowSignup] = useState(false);
    const [avatars, setAvatars] = useState(['default-avatar.png']);
    const [selectedAvatar, setSelectedAvatar] = useState(null);

    useEffect(() => {
        const loadAvatars = async () => {
            try {
                const response = await fetch(`${process.env.PUBLIC_URL}/avatars/manifest.json`);
                if (!response.ok) throw new Error('Avatar manifest not found');
                const data = await response.json();
                setAvatars(data.avatars || ['default-avatar.png']);
                
                data.avatars.forEach(avatar => {
                    new Image().src = `${process.env.PUBLIC_URL}/avatars/${avatar}`;
                });
            } catch (error) {
                console.log('Using default avatars');
                setAvatars(['default-avatar.png']);
            }
        };
        loadAvatars();
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        
        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                localStorage.setItem('currentUser', data.username);
                setCurrentUser(data.username);
            } else {
                alert('Invalid credentials');
            }
        } catch (error) {
            alert('Login error');
        }
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        if (!selectedAvatar) return alert('Please select avatar');
        
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        data.avatar = selectedAvatar;

        try {
            const response = await fetch('/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                localStorage.setItem('currentUser', data.username);
                localStorage.setItem('userAvatar', selectedAvatar);
                setCurrentUser(data.username);
            } else {
                alert('Username exists');
            }
        } catch (error) {
            alert('Signup error');
        }
    };

    const toggleAuthMode = (e) => {
        e.preventDefault();
        setShowSignup(!showSignup);
    };

    return (
        <div className="login-container">
            <img 
                src={`${process.env.PUBLIC_URL}/images/Screenshot 2024-12-02 121802.png`} 
                alt="Yaply Logo" 
                className="logo" 
            />
            
            {!showSignup ? (
                <form onSubmit={handleLogin}>
                    <h2>Welcome Back!</h2>
                    <input name="username" placeholder="Username" required />
                    <input name="password" type="password" placeholder="Password" required />
                    <button type="submit">Login</button>
                    <p>Don't have an account? <button type="button" className="auth-toggle" onClick={toggleAuthMode}>Sign Up</button></p>
                </form>
            ) : (
                <form onSubmit={handleSignup}>
                    <h2>Create Account</h2>
                    <input name="username" placeholder="Username" required />
                    <input name="password" type="password" placeholder="Password" required />
                    <div className="avatar-selection">
                        <h3>Choose Avatar</h3>
                        <div className="avatar-grid">
                            {avatars.map(avatar => (
                                <img
                                    key={avatar}
                                    src={`${process.env.PUBLIC_URL}/avatars/${avatar}`}
                                    className={`avatar-option ${selectedAvatar === avatar ? 'selected' : ''}`}
                                    onClick={() => setSelectedAvatar(avatar)}
                                    alt="Avatar"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = `${process.env.PUBLIC_URL}/images/default-avatar.png`;
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                    <button type="submit">Sign Up</button>
                    <p>Already have an account? <button type="button" className="auth-toggle" onClick={toggleAuthMode}>Login</button></p>
                </form>
            )}
        </div>
    );
};

export default Auth;