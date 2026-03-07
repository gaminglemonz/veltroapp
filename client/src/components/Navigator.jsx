import React, { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/auth";
import useMediaQuery from "../utilities/useMediaQuery";
import { AnimatePresence, motion } from "motion/react";
import Profile from "../components/Profile";
import axios from 'axios';

const Navigator = () => {
    const [ navShow, setNavShow ] = useState(false);
    const [ DMShow, setDMShow ] = useState(true);
    const [ roomsShow, setRoomsShow ] = useState(false);
    const [ profileShow, setProfileShow ] = useState(false);

    const isSmallScreen = useMediaQuery("(max-width: 639px)");
    const isLargeScreen = useMediaQuery("(min-width: 1024px)");

    const { data, loading } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (!data || loading) return null;
    }, [data, loading]);
    
    const { user, friends, rooms } = data || {};

    useEffect(() => {
        if (isLargeScreen) setNavShow(true);
    }, []);

    const createPrivateMessage = async (id) => {
        const response = await axios.post(`/api/create-private-message/${id}`, {
            withCredentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            }
        });
        if (response.data.success) {
            navigate(`/messages/${response.data.encryptedId}`);
        } else {
            console.error('Error creating private message:', response.data.error);
        }
    }

    console.log(rooms);
    return (
        <>
            {profileShow && <div className="fixed top-0 left-0 w-full h-full z-20 blur-xl"></div> }
            <AnimatePresence>
                {profileShow && <Profile id={user.id} profileShow={profileShow} setShowProfile={setProfileShow} />}
            </AnimatePresence>
            <div className="fixed left-0 top-0 bg-black backdrop-blur-lg text-white 
                            pl-10 pr-16 py-10 mr-[20%] w-[20%] h-screen max-h-screen overflow-y-auto z-50"
                 style={{ display: navShow ? "block" : "none" }}>
                <div className="hover:bg-slate-600 hover:bg-opacity-50 p-5 mb-16 flex items-center justify-start rounded-xl 
                                cursor-pointer transition-all duration-500" onClick={() => setProfileShow(!profileShow)}>
                    <img src={`/avatar/${user?.id}`} alt={`${user?.username}'s Avatar`} 
                        className="rounded-full mr-4 w-10 sm:w-12 md:w-14 h-auto" />
                     <div className="flex flex-col">
                        <h1 className="text-xl font-bold">{user.name}</h1>
                        <h2 className="text-lg text-gray-400">@{user.username}</h2>
                    </div>
                </div>
                <h2 className="hover:bg-slate-600 hover:bg-opacity-50 font-bold text-lg p-2 mb-3 flex items-center cursor-pointer
                              rounded-md transition-all duration-300" onClick={() => setDMShow(!DMShow)}>PRIVATE MESSAGES{" "}
                    <motion.span className="material-icons" initial={{ rotate: 0 }} animate={{ rotate: DMShow ? 180 : 0 }}>keyboard_arrow_up</motion.span>
                </h2>
                <motion.div className="overflow-hidden" initial={{ height: 0, opacity: 0 }} 
                            animate={{ height: DMShow ? "auto" : 0, opacity: DMShow ? 1 : 0 }}  
                            transition={{ duration: 0.2, ease: "easeInOut" }}>
                    {
                        friends.map((friend) => {
                            return (
                                <div key={friend.id} className="hover:bg-slate-600 hover:bg-opacity-50 p-5 flex items-center justify-start rounded-xl 
                                     cursor-pointer transition-all duration-500" 
                                     onClick={() => createPrivateMessage(friend.id)}>
                                    <img src={`/avatar/${friend?.id}`} alt={`${friend?.username}'s Avatar`} 
                                        className="rounded-full mr-4 w-10 sm:w-12 md:w-14 h-auto" />
                                    <div className="flex flex-col">
                                        <h1 className="text-xl font-bold">{friend.name}</h1>
                                        <h2 className="text-lg text-gray-400">@{friend.username}</h2>
                                    </div>
                                </div>
                            )
                        })
                    }
                </motion.div>
                <h2 className="hover:bg-slate-600 hover:bg-opacity-50 font-bold text-lg p-2 mt-4 mb-6 flex items-center cursor-pointer
                              rounded-md transition-all duration-300" onClick={() => setRoomsShow(!roomsShow)}>ROOMS{" "}
                    <motion.span className="material-icons" initial={{ rotate: 0 }} animate={{ rotate: roomsShow ? 180 : 0 }}>keyboard_arrow_up</motion.span>
                </h2>
                <motion.div className="overflow-hidden" initial={{ height: 0, opacity: 0 }} 
                            animate={{ height: roomsShow ? "auto" : 0, opacity: roomsShow ? 1 : 0 }}  
                            transition={{ duration: 0.2, ease: "easeInOut" }}>
                    {
                        rooms.map((room) => {
                            return (
                                <div key={room.id} className="hover:bg-slate-600 hover:bg-opacity-50 p-5 flex items-center justify-start rounded-xl 
                                                cursor-pointer transition-all duration-500" onClick={() => navigate(`/rooms/${room.id}`)}>
                                    <img src={room.icon} alt={`${room?.name}'s Icon`} 
                                        className="rounded-xl mr-4 w-10 sm:w-12 md:w-14 h-auto" />
                                    <div className="flex flex-col">
                                        <h1 className="text-xl font-bold">{room.name}</h1>
                                        <h2 className="text-lg text-gray-400">Owned by {room.owner}</h2>
                                    </div>
                                </div>
                            )
                        })
                    }
                </motion.div>
            </div>
        </>
    );
};

export default Navigator;