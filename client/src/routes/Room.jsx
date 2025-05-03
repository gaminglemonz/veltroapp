import React, { useEffect, useState, useRef, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Members from "../components/Members";
import Header from "../components/Header";
import Loading from "../components/Loading";
import { AuthContext } from "../context/auth";
import { io } from "socket.io-client";

const Room = () => {
    const { id } = useParams();
    const [ socket, setSocket ] = useState(null);
	const [ room, setRoom ] = useState(null);
    const [ members, setMembers ] = useState([]);
    const [ message, setMessage ] = useState("");
    const [ messages, setMessages ] = useState([]);
    const [ typing, setTyping ] = useState(false);
    const [ error, setError ]  = useState(null);
    const [ showMembersPanel, setShowMembersPanel ] = useState(false);
    const [ showInfoPanel, setShowInfoPanel ] = useState(false);
	const { data, loading } = useContext(AuthContext);
    const messagesEndRef = useRef(null);

    const user = data?.user;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(() => {
        const fetch = async () => {
            try {
                const response = await axios.get(`/api/rooms/${id}`, {
                    headers: {
                        'Content-Type': "application/json",
                        'Accept': "application/json",
                    },
                });
                console.log("Returned room data:", response.data.room);
				if (response.data.success) {
                    setRoom(response.data.room);
					setMessages(response.data.messages);
                    setMembers(response.data.members);
					scrollToBottom();
				} else {
					setMessages([]);
                    setMembers([]);
					setRoom(null);
					setError(response.data.error);
					console.error('Error fetching messages:', response.data.error);
				}
            } catch (err) {
                console.error(`Error fetching messages: ${err.message}`);
                setError(err.message);
            }
        }
        fetch();
    }, []);
    
    // console.log("Data from context:", data);
    console.log("User data for room:", user);
    console.log("Current message list:", messages);
    // console.log("Current members list:", members);

    useEffect(() => {
        if (loading || !user) return;

        const newSocket = io("http://localhost:3000", {
            query: { username: user.name,  roomId: id, roomName: room.name, avatar: `/avatar/${user.id}` },
            auth: { serverOffset: 0 },
        });

        setSocket(newSocket);
        console.log(socket);

        return () => {
            newSocket.disconnect();
        }
    }, [user, room, loading]);
    useEffect(() => {
        if (!room || !socket) return;
        socket.connect();
        socket.emit("join room", { room });

        socket.on("message", (data) => {
            setMessages((prev) => [
                ...prev,
                {
                    username: data.user,
                    content: data.msg,
                    timestamp: data.timestamp,
                    avatar: data.avatar,
                },
            ]);
            scrollToBottom();
        });
        socket.on("user typing", (typer) => {
            if (typer.name !== user.name) {
                setTyping(true);
                setTimeout(() => setTyping(false), 1000)
            }
        })

        return () => {
            socket.off("message");
            socket.disconnect();
        };
    }, [socket, user, room]);
    useEffect(() => {
        if (room) document.title = `${room.name} - Veltro`;
    }, [room]);
    useEffect(() => {
        scrollToBottom();
    }, []);

    if (loading || !data) return <Loading />;

    const sendMessage = (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        socket.emit("message", {
            roomId: id, msg: message.trim(), user: user.name, avatar: `avatar/${user.id}/`,
        });
        setMessage("");
        scrollToBottom();
    };
    const handleTyping = () => {
        socket.emit("user typing", { name: user.name, roomId: id });
    }
    const togglePanel = (panel) => {
        if (panel === "members") {
            setShowMembersPanel((prev) => !prev);
            setShowInfoPanel(false);
        } else if (panel === "info") {
            setShowInfoPanel((prev) => !prev);
            setShowMembersPanel(false);
        }
    }
    
    return (
        <div className="bg-slate-900 text-white h-screen overflow-hidden relative">
            <div className="messages-wrapper h-[calc(100vh-144px)] relative z-20">
                <div id="messages" className="px-12 h-full overflow-y-auto">
                    {messages.map((msg, index) => (
                        <div key={index} className="my-3">
                            
                            {msg.username !== user.name ? (
                                <span className="text-gray-500 text-md dark:text-gray-200">
                                    {msg.username !==
                                            (index > 0
                                                ? messages[index - 1].username
                                            : "") && (
                                        <img src={msg.avatar} alt={`${msg.avatar}`} width="30" className="inline cursor-pointer rounded-full mr-2" />
                                    )}
                                    {msg.username}
                                </span>
                            ) : (
                                <div />
                            )}
                            <div className={
                                    msg.username === user.name
                                        ? "bg-sky-200 p-4 rounded-lg w-fit max-w-1/2 ml-auto"
                                        : "bg-gray-400 p-4 rounded-lg w-fit max-w-1/2"
                                }>
                                <p className="my-2 text-black text-xl">{msg.content}</p>
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

            <form id="form" onSubmit={sendMessage} className="fixed bottom-0 left-0 p-12 bg-transparent backdrop-blur-md shadow-lg w-full">
                <input id="input" autoComplete="off" placeholder="send a message..." className="focus:outline-none bg-slate-600 text-white p-3 mr-10 rounded-md w-[90%]"
                       value={message} onChange={(e) => setMessage(e.target.value)} onInput={handleTyping} />
                <button id="send-button" type="submit" className="material-icons bg-black text-white text-center font-bold p-3 rounded-full disabled:opacity-30"
                    disabled={!message.trim()}>arrow_upward</button>
            </form>

            <div id="control-panel" className="select-none flex fixed top-10 right-10 p-6 bg-black bg-opacity-35 
				 backdrop-blur-md rounded-xl z-50">
                <i className="material-symbols-outlined font-bold cursor-pointer mx-3 text-4xl 
				 hover:text-gray-300 transition-colors" id="toggle-info" onClick={() => togglePanel("info")}>info</i>
                <i className="material-icons font-bold cursor-pointer mx-3 text-4xl hover:text-gray-300 transition-colors"
                    id="toggle-members" onClick={() => togglePanel("members")}>groups</i>
            </div>

            {showMembersPanel && (
                <div id="members-panel" className="bg-black bg-opacity-35 backdrop-blur-md fixed top-40 right-10 
					 px-16 py-10 z-10 rounded-xl transition-all">
                    <h2 className="font-bold text-3xl">People</h2>
                    <Members members={members} />
                </div>
            )}

            {showInfoPanel && (
                <div id="info" className="bg-black bg-opacity-35 backdrop-blur-md fixed top-40 right-10 px-16 py-10
					 z-10 rounded-xl transition-all">
                    <h2 className="font-bold text-3xl mb-7">Additional Info</h2>
                    <h3 className="font-bold text-2xl my-2">Room Name</h3>
                    <p className="font-bold text-xl mb-7">{room.name}</p>
                    <h3 className="font-bold text-2xl my-2">Owner</h3>
                    <p className="font-bold text-xl">{room.owner}</p>
                    <h3 className="font-bold text-2xl my-2">Description</h3>
                    <p className="font-bold text-xl">{room.description}</p>
                </div>
            )}

			<Header />
        </div>
    );
};

export default Room;