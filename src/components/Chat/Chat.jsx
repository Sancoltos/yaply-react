import React, { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import ChannelList from './ChannelList';
import Message from './Message';
import './Chat.css';

const Chat = ({ currentUser, onLogout }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [currentChannel, setCurrentChannel] = useState('general');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const socketRef = useRef();
  const messagesEndRef = useRef(null);
  const userAvatar = localStorage.getItem('userAvatar') || 'default-avatar.png';

  useEffect(() => {
    socketRef.current = io();
    socketRef.current.emit('user-connected', {
      username: currentUser,
      avatar: userAvatar
    });

    socketRef.current.on('channelMessages', (messages) => {
      setMessages(messages);
    });

    socketRef.current.on('newMessage', (message) => {
      setMessages(prev => [...prev, message]);
    });

    socketRef.current.on('update-online-users', (users) => {
      setOnlineUsers(users);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [currentUser, userAvatar]);

  useEffect(() => {
    if (isInitialLoad) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
        setIsInitialLoad(false);
      }, 100);
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isInitialLoad]);

  const joinChannel = (channel) => {
    setCurrentChannel(channel);
    socketRef.current.emit('joinChannel', channel);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const message = {
      channel: currentChannel,
      message: inputMessage.trim(),
      username: currentUser
    };

    socketRef.current.emit('sendMessage', message);
    setInputMessage('');
  };

  return (
    <div className="layout-container">
      <div className="sidebar">
        <div className="logo-container">
          <img src="/images/Screenshot 2024-12-02 121802.png" alt="Logo" className="sidebar-logo" />
        </div>
        <button onClick={onLogout} className="logout-button">
          Logout
        </button>
        <ChannelList currentChannel={currentChannel} joinChannel={joinChannel} />
      </div>

      <div className="chat-container">
        <div className="chat-header">
          <div className="online-user current-user">
            <img 
              src={`/avatars/${userAvatar}`} 
              alt={currentUser}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/images/default-avatar.png';
              }}
            />
            <span>{currentUser} (You)</span>
          </div>
          {onlineUsers.map(([username, userData]) => (
            username !== currentUser && (
              <div key={username} className="online-user">
                <img 
                  src={`/avatars/${userData.avatar || 'default-avatar.png'}`} 
                  alt={username}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/images/default-avatar.png';
                  }}
                />
                <span>{username}</span>
              </div>
            )
          ))}
        </div>

        <div className="chat-messages">
          {messages.map((msg, i) => (
            <Message key={i} message={msg} />
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form className="chat-input" onSubmit={sendMessage}>
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type a message..."
          />
        </form>
      </div>
    </div>
  );
};

export default Chat;