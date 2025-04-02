import React from 'react';

const Message = ({ message }) => {
  return (
    <div className="message">
      <span className="username">{message.username}</span>
      <span className="message-content">{message.message}</span>
      <span className="timestamp">
        {new Date(message.timestamp).toLocaleTimeString()}
      </span>
    </div>
  );
};

export default Message;