import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import socket from '../../socket';
import Members from '../components/Members';

const Room = ({ user, room, members }) => {
  const { id } = useParams(); // Expect the room id from the URL
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState(null);
  const [showMembersPanel, setShowMembersPanel] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const messagesEndRef = useRef(null);

  // Fetch initial messages from API
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(`http://localhost:5000/rooms/messages/${room.id}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setMessages(data);
        scrollToBottom();
      } catch (err) {
        console.error(`Error fetching messages: ${err}`);
        setError(err.message);
      }
    };
    if (room && room.id) {
      fetchMessages();
    }
  }, [id, room]);

  // Setup socket listeners and join room
  useEffect(() => {
    if (!room || !user) return;

    socket.connect();
    socket.emit('join room', { room });

    socket.on('message', (data) => {
      setMessages((prev) => [
        ...prev,
        {
          user: data.user,
          msg: data.msg,
          timestamp: data.timestamp,
          avatar: data.avatar,
        },
      ]);
      scrollToBottom();
    });

    socket.on('error', (error) => {
      setError(error);
    });

    return () => {
      socket.off('message');
      socket.off('error');
      socket.disconnect();
    };
  }, [id, room, user]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    socket.emit('message', {
      roomId: room.id,
      msg: message.trim(),
    });
    setMessage('');
  };

  const handleTyping = () => {
    socket.emit('user typing', { roomId: room.id, user });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const togglePanel = (panel) => {
    if (panel === 'members') {
      setShowMembersPanel((prev) => !prev);
      setShowInfoPanel(false);
    } else if (panel === 'info') {
      setShowInfoPanel((prev) => !prev);
      setShowMembersPanel(false);
    }
  };

  return (
    <div className="dark:bg-slate-900 dark:text-white h-screen overflow-hidden relative">
      {/* Messages Area */}
      <div className="messages-wrapper h-[calc(100vh-144px)] relative z-20">
        <div id="messages" className="px-12 h-full overflow-y-auto">
          {messages.map((msg, index) => (
            <div key={index} className="my-3">
              <div className={msg.user === user.name ? 'bg-sky-200 p-4 rounded-tl-none rounded-lg' : 'bg-gray-400 p-4 rounded-xl'}>
                <span className="text-gray-500 text-md dark:text-gray-200">
                  {msg.user !== (index > 0 ? messages[index - 1].user : '') && (
                    <img src={msg.avatar} alt={`${msg.user}'s Avatar`} width="30" className="inline cursor-pointer rounded-full mr-2" />
                  )}
                  {msg.user}
                </span>
                <p className="my-2 text-black text-xl">{msg.msg}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        {typing && (
          <div id="typing" className="absolute bottom-0 left-0 px-12">
            <span className="animate-ping w-full h-full bg-slate-500 block"></span>
          </div>
        )}
      </div>

      {/* Message Input Form */}
      <form
        id="form"
        onSubmit={sendMessage}
        className="fixed bottom-0 left-0 p-12 bg-transparent backdrop-blur-md shadow-lg w-full"
      >
        <input
          id="input"
          autoComplete="off"
          placeholder="send a message..."
          className="focus:outline-none dark:bg-slate-600 dark:text-white text-black p-5 rounded-md w-[95%]"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onInput={handleTyping}
        />
        <button
          id="send-button"
          type="submit"
          className="material-icons bg-black text-white text-center font-bold p-5 rounded-full disabled:opacity-30"
          disabled={!message.trim()}
        >
          send
        </button>
      </form>

      {/* Control Panel */}
      <div id="control-panel" className="select-none flex fixed top-10 right-10 p-6 bg-black bg-opacity-35 backdrop-blur-md rounded-xl z-50">
        <i
          className="material-symbols-outlined font-bold cursor-pointer mx-3 text-4xl hover:text-gray-300 transition-colors"
          id="toggle-info"
          onClick={() => togglePanel('info')}
        >
          info
        </i>
        <i
          className="material-icons font-bold cursor-pointer mx-3 text-4xl hover:text-gray-300 transition-colors"
          id="toggle-members"
          onClick={() => togglePanel('members')}
        >
          groups
        </i>
      </div>

      {/* Members Panel */}
      {showMembersPanel && (
        <div
          id="members-panel"
          className="bg-black bg-opacity-35 backdrop-blur-md fixed top-40 right-10 px-16 py-10 z-10 rounded-xl transition-all"
        >
          <h2 className="font-bold text-3xl">People</h2>
          <Members members={members} />
        </div>
      )}

      {/* Additional Info Panel */}
      {showInfoPanel && (
        <div
          id="info"
          className="bg-black bg-opacity-35 backdrop-blur-md fixed top-40 right-10 px-16 py-10 z-10 rounded-xl transition-all"
        >
          <h2 className="font-bold text-3xl mb-7">Additional Info</h2>
          <h3 className="font-bold text-2xl my-2">Room Name</h3>
          <p className="font-bold text-xl mb-7">{room.name}</p>
          <h3 className="font-bold text-2xl my-2">Owner</h3>
          <p className="font-bold text-xl">{room.owner}</p>
          <h3 className="font-bold text-2xl my-2">Description</h3>
          <p className="font-bold text-xl">{room.description}</p>
        </div>
      )}
    </div>
  );
};

export default Room;
