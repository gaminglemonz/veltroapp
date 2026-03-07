import React, { useEffect, useState, useRef, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../components/Header";
import Loading from "../components/Loading";
import Navigator from "../components/Navigator";
import { AuthContext } from "../context/auth";
import { io } from "socket.io-client";
import { motion } from "motion/react";
import CryptoJS from 'crypto-js';

const Messages = () => {
    const { encryptedId } = useParams();
    const [ socket, setSocket ] = useState(null);
    const [ receiverID, setReceiverID ] = useState(0);
    const [ roomID, setRoomID ] = useState(0);
    const [ message, setMessage ] = useState("");
    const [ messages, setMessages ] = useState([]);
    const [ typing, setTyping ] = useState(false);
    const [ error, setError ]  = useState(null);
	const { data, loading } = useContext(AuthContext);
    const messagesEndRef = useRef(null);

    const user = data?.user;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(() => {
        const fetch = async () => {
            try {
                const response = await axios.get(`/api/messages/${encryptedId}`, {
                    headers: {
                        'Content-Type': "application/json",
                        'Accept': "application/json",
                    },
                });
                console.log("Data received:", response.data);
                console.log("Messages loaded:", response.data.messages);
				if (response.data.success) {
					setMessages(response.data.messages);
                    setReceiverID(response.data.receiverID);
                    setRoomID(response.data.roomID);
					scrollToBottom();
				} else {
					setMessages([]);
                    setReceiverID(0);
                    setRoomID(0);
                    console.log("Receiver iD:", response.data.receiverID);
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
    // console.log("Current message list:", messages);

    useEffect(() => {
        if (loading || !user) return;
 
        const newSocket = io("http://localhost:3000", {
            query: { 
                username: user.name, 
                userID: user.id,
                roomId: roomID,
                PMID: encryptedId, 
                avatar: `/avatar/${user.id}`,
            },
            auth: { serverOffset: 0 },
        });

        setSocket(newSocket);
        console.log(socket);

        return () => {
            newSocket.disconnect();
        }
    }, [user, loading]);
    useEffect(() => {
        if (!socket) return;
        socket.connect();

        socket.on("private message", (data) => {
            setMessages((prev) => [
                ...prev,
                {
                    username: data.user,
                    content: data.msg,
                    timestamp: data.timestamp,
                    avatar: data.avatar,
                    encrypted: false,
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
            socket.off("private message");
            socket.disconnect();
        };
    }, [socket, user]);
    useEffect(() => {
        document.title = `Private Messages - Veltro`;
    }, []);
    useEffect(() => {
        scrollToBottom();
    }, []);

    if (loading || !data) return <Loading />;

    const sendMessage = (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        socket.emit("private message", {
            PMID: encryptedId,
            msg: message.trim(),
            receiverID,
            name: user.name,
            avatar: `avatar/${user.id}/`,
        });
        setMessage("");
        scrollToBottom();
    };

    const isHex = (str) =>
        typeof str === "string" &&
        /^[0-9a-fA-F]+$/.test(str) &&
        str.length % 2 === 0 &&
        str.length > 32;

    const decrypter = (text) => {
        try {
            // console.log(text);
            const keyHex = import.meta.env.VITE_AES_KEY;
            const ivHex = import.meta.env.VITE_AES_IV;
            if (!keyHex || !ivHex) {
                console.error("Missing AES_KEY or AES_IV.");
                return "[decryption error]";
            }
            const key = CryptoJS.enc.Hex.parse(keyHex);
            const iv = CryptoJS.enc.Hex.parse(ivHex);
            const ciphertextBase64 = CryptoJS.enc.Hex.parse(text).toString(CryptoJS.enc.Base64);
            const decrypted = CryptoJS.AES.decrypt(
                ciphertextBase64,
                key,
                { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
            );
            const result = decrypted.toString(CryptoJS.enc.Utf8);
            // console.log(result);
            return result || "[decryption error]";
        } catch (err) {
            console.error("Decryption error:", err);
            return "[decryption error]";
        }
    };

    // const handleTyping = () => {
    //     socket.emit("private user typing", { name: user.name, roomId: id });
    // }
    
    return (
        <div className="ml-[20%]">
            <div className="bg-slate-900 text-white h-screen overflow-hidden relative">
                <div className="messages-wrapper h-[calc(100vh-144px)] relative z-20">
                   <div id="messages" className="px-12 py-24 h-full overflow-y-auto">
                        {messages.map((msg, index) => (
                            <div key={index} className="my-3 w-fit max-w-fit ">
                                    {msg.username !==
                                            (index > 0
                                                ? messages[index - 1].username
                                            : "") && (
                                        <div className="text-slate-300 px-3 py-6 rounded-t-xl">
                                            <img src={`${window.location.origin}/${msg.avatar}`} alt={`${msg.avatar}`} width="45" className="inline cursor-pointer rounded-full mr-4" />
                                            <p className="inline text-2xl font-bold">{msg.username}</p>
                                        </div>
                                    )}
                                <p className={
                                    msg.username === user.name ? 
                                    "ml-auto text-xl px-3 py-2" : 
                                    "text-xl px-3 py-2"
                                }>{msg.encrypted ? decrypter(msg.content) : msg.content}</p>
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

                <form id="form" onSubmit={sendMessage} className="fixed bottom-0 left-[20%] py-16 px-12 bg-transparent backdrop-blur-md 
                                                                  shadow-lg flex justify-center w-[80%]">
                    <input id="input" autoComplete="off" placeholder="send a message..." className="focus:outline-none bg-slate-700 text-white text-xl px-6 py-4 mr-10 rounded-full w-[90%]"
                        value={message} onChange={(e) => setMessage(e.target.value)} />
                    <button id="send-button" type="submit" className="material-icons bg-black text-white text-2xl text-center 
                                                                    font-bold px-5 py-3 rounded-full transition-all duration-300 disabled:opacity-30"
                        disabled={!message.trim()}>arrow_upward</button>
                </form>

            </div>
            <Header />
            <Navigator />
        </div>
    );
};

export default Messages;