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
    console.log('Initializing socket connection');
    socketRef.current = io('http://localhost:3001', {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5
    });
    
    console.log('Emitting user-connected event');
    socketRef.current.emit('user-connected', {
      username: currentUser,
      avatar: userAvatar
    });

    socketRef.current.on('connect', () => {
      console.log('Socket connected');
      socketRef.current.emit('joinChannel', currentChannel);
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    socketRef.current.on('channelMessages', (messages) => {
      console.log('Received channel messages:', messages);
      setMessages(messages || []);
    });

    socketRef.current.on('newMessage', (message) => {
      console.log('Received new message:', message);
      if (message.channel === currentChannel) {
        console.log('Adding message to current channel');
        setMessages(prev => [...prev, message]);
      }
    });

    socketRef.current.on('update-online-users', (users) => {
      console.log('Received online users update:', users);
      setOnlineUsers(users);
    });

    return () => {
      console.log('Cleaning up socket connection');
      socketRef.current.disconnect();
    };
  }, [currentUser, userAvatar, currentChannel]);

  useEffect(() => {
    if (isInitialLoad) {
      console.log('Initial load, scrolling to bottom');
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
        setIsInitialLoad(false);
      }, 100);
    } else {
      console.log('New message, scrolling to bottom');
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isInitialLoad]);

  const joinChannel = (channel) => {
    console.log('Joining channel:', channel);
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

    console.log('Sending message:', message);
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
              src={`/images/avatars/${userAvatar}`} 
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
                  src={`/images/avatars/${userData.avatar || 'default-avatar.png'}`} 
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