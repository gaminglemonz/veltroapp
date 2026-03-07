import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import axios from 'axios';
import PrivateRoomLogin from '../components/PrivateRoomLogin';
import { motion, AnimatePresence } from 'framer-motion';

const Rooms = () => {
    const [ rooms, setRooms ] = useState([]);
    const [ showLogin, setShowLogin ] = useState(false);
    const [ showSearch, setShowSearch ] = useState(false);
    const [ loading, setLoading ] = useState(true);

    useEffect(() => {
        document.title = "Veltro - Rooms";
        rooms.sort((a, b) => {
            return b.memberCount - a.memberCount;
        });
        async function fetch () {
            try {
                const response = await axios.get("/api/roomlist", {
                    withCredentials: true,
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                    },
                });

                console.log("Room list response:", response);
                if (response.data.success) {
                    console.log("Room list:", response.data.rooms);
                    setRooms(response.data.rooms);
                } else {
                    console.error("Unsuccessful retrieval of room list:", response.data.error);
                    setRooms([]);
                }
            } catch (err) {
                setRooms([]);
                console.error("Error fetching rooms:", err.message);
            } finally {
                setLoading(false);
            }
        }
        fetch();
    }, []);

    return (
        <div className="text-white bg-slate-900 h-screen overflow-x-hidden m-0">
            <div className="relative h-64 bg-gradient-to-r from-indigo-600 to-purple-600">
                <div className="absolute bottom-0 left-0 right-0 px-8 py-4 bg-black bg-opacity-40">
                    <div className="relative left-10 flex items-end space-x-6">
                        <div className="w-32 h-32 rounded-full border-4 border-white bg-transparent flex items-center justify-center transform -translate-y-16 duration-500 transition hover:scale-110 cursor-default">
                            <i className="material-icons text-6xl text-white">forum</i>
                        </div>
                        <div className="pb-4">
                            <h1 className="text-4xl font-bold text-white">Room List</h1>
                            <h1 className="text-xl mt-2">Find and join rooms</h1>
                        </div>
                    </div>
                </div>
            </div>
            <div className="bg-slate-800 m-4 p-3 rounded-xl flex justify-end">
                <a href="/create-room" className="material-icons p-3 bg-transparent rounded-full
                                                  cursor-pointer select-none transition duration-500
                                                hover:bg-slate-600 hover:bg-opacity-65">add</a>
                <i className="material-icons p-3 bg-transparent rounded-full 
                              cursor-pointer select-none transition duration-500 
                            hover:bg-slate-600 hover:bg-opacity-65">grid_view</i>
                <i className="material-icons p-3 bg-transparent rounded-full 
                              cursor-pointer select-none transition duration-500
                            hover:bg-slate-600 hover:bg-opacity-65">search</i>
                <i className="material-icons p-3 bg-transparent rounded-full 
                              cursor-pointer select-none transition duration-500
                            hover:bg-slate-600 hover:bg-opacity-65"
                   onClick={() => setShowLogin(true)}>lock</i>
            </div>
            <div className="fade-in mt-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-6">
                { rooms.map((room) => {
                    const roomIcon = (typeof room.icon === 'string' && room.icon) ?
                                     room.icon.replace('/public', '..') : '/images/default-icon.png';
                    const roomBanner = (typeof room.banner === 'string' && room.banner) ?
                                       room.banner.replace('/public', '..') : '/images/default-banner.png';
                    if (room.visibility === 'Public') {
                        return (
                            <div key={room.id} className="bg-slate-800 w-full rounded-lg shadow-lg
                                                          overflow-hidden transform transition-all duration-300
                                                          hover:scale-102 hover:shadow-xl">
                                <div className="relative group">
                                    <div
                                        style={{ backgroundImage: `url(${roomBanner})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                                        className="w-full h-24">
                                        <div className="absolute inset-0 bg-black bg-opacity-40 
                                                        transition-all duration-300 group-hover:bg-opacity-20"></div>
                                    </div>
                                    <img
                                        className="absolute top-2 left-2 w-10 h-10 
                                                   rounded-full border-2 border-slate-800 shadow-md
                                                   transition-transform group-hover:scale-105"
                                        src={roomIcon}
                                        alt="Room Icon"
                                    />
                                </div>
                                <div className="p-3">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h2 className="font-bold text-lg mb-0.5 text-white">{room.name}</h2>
                                            <h3 className="text-xs text-gray-400">
                                                By <span className="font-medium text-gray-300">{room.owner}</span>
                                            </h3>
                                        </div>
                                        <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-700 text-gray-300">
                                            {room.type || 'Unknown'}
                                        </span>
                                    </div>
                                    <p className="text-gray-400 text-sm mb-3 line-clamp-1">{room.description || 'No description available'}</p>
                                    <div className="flex justify-between items-center">
                                        <div className="flex space-x-3 text-xs text-gray-400">
                                            <span className="flex items-center">
                                                <i className="material-icons text-sm mr-1">group</i>
                                                {room.memberCount || 0}
                                            </span>
                                            <span className="flex items-center">
                                                <i className="material-icons text-sm mr-1">chat</i>
                                                {room.messageCount || 0}
                                            </span>
                                        </div>
                                        <a href={`/rooms/${room.id}`} className="px-3 py-1 bg-indigo-600 text-white text-xs
                                            rounded-md font-medium transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-1">
                                            Join
                                        </a>
                                    </div>
                                </div>
                            </div>
                        );
                    }
                })}
            </div>
            <Header />
            <AnimatePresence>
                { showLogin && <PrivateRoomLogin show={showLogin} setShowLogin={setShowLogin} /> }
            </AnimatePresence>
        </div>
    );
};

export default Rooms;