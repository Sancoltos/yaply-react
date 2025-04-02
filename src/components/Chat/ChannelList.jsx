import React from 'react';

const channels = [
  'general', 'sports', 'video-games', 'deep-talks',
  'anime', 'study-zone', 'politics', 'movies',
  'novels', 'fashion', 'announcement', 'advertising',
  'programming'
];

const ChannelList = ({ currentChannel, joinChannel }) => {
  return (
    <div className="channel-list">
      {channels.map(channel => (
        <a
          key={channel}
          href={`#${channel}`}
          className={currentChannel === channel ? 'active' : ''}
          onClick={(e) => {
            e.preventDefault();
            joinChannel(channel);
          }}
        >
          {channel.replace('-', ' ')}
        </a>
      ))}
    </div>
  );
};

export default ChannelList;