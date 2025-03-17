import React from 'react';

const Message = ({ message, isCurrentUser }) => (
    <div className={`my-3 ${isCurrentUser ? 'text-right' : 'text-left'}`}>
        <div className={`inline-block p-4 rounded-lg ${
            isCurrentUser ? 'bg-sky-200 rounded-tr-none' : 'bg-gray-400 rounded-tl-none'
        }`}>
            <div className="flex items-center gap-2 mb-1">
                <img 
                    src={message.avatar} 
                    alt={`${message.user}'s avatar`} 
                    className="w-6 h-6 rounded-full"
                />
                <span className="text-sm text-gray-600">{message.user}</span>
            </div>
            <p className="text-black">{message.msg}</p>
            <span className="text-xs text-gray-500">
                {new Date(message.timestamp).toLocaleTimeString()}
            </span>
        </div>
    </div>
);

export default Message;