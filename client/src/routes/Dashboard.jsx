import React, { useEffect, useContext, useState } from 'react';
import Header from '../components/Header';
import Editor from '../components/Editor';
import Loading from '../components/Loading';
import FriendRequest from '../components/FriendRequest';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/auth';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComment } from '@fortawesome/free-solid-svg-icons'
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';

const Dashboard = () => {
    const { data, loading } = useContext(AuthContext);
    const { user, friends, friendRequests, rooms } = data || {};
    const navigate = useNavigate();
    const [ showEditor, setShowEditor ] = useState(false);
    const [ showRequest, setShowRequest ] = useState(false);
    const [ friendsTab, setFriendsTab ] = useState(1);

    const activityTypeToIcon = {
        "message": "chat_bubble",
        "joined_room": "group_add",
        "left_room" : "group_remove",
    };
    const activities = [
        {
            type: "joined_room",
            description: "Joined Room #1",
            timestamp: "2023-10-01 12:00",
        },
    ];

    console.log("Received data:", data);

    useEffect(() => {
        document.title = "Veltro - Dashboard";
        if (!loading && !data) {
            navigate('/login');
        }
    }, [data, loading, navigate]);

    if (loading || !data || !user) {
        return (
            <Loading />
        );
    }

    const leaveRoom = async (id, e) => {
        e.preventDefault();
        try {
            const response = await axios.post(`/leave-room/${id}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
            });
            if (response.data.success) {
                navigate('/dashboard');
            } else {
                console.error('Error leaving room:', response.data.error);
            }
        } catch (err) {
            console.error("Error leaving room:", err.message);
        }
    }
    const removeFriend = async (id) => {
        try {
            const response = await axios.post(`/remove-friend/${id}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
            });
            if (response.data.success) {
                navigate('/dashboard');
            } else {
                console.error('Error removing friend:', response.data.error);
            }
        } catch (err) {
            console.error("Error removing friend:", err.message);
        }
    }
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

    return (
        <div className="bg-slate-900 overflow-x-hidden min-h-screen text-white">
            <div className="relative h-64 bg-gradient-to-r from-indigo-600 to-purple-600">
                <div className="absolute bottom-0 left-0 right-0 px-8 py-4 bg-black bg-opacity-40">
                    <div className="relative left-10 flex items-end space-x-6">
                        <img
                            src={`/avatar/${user.id}`}
                            alt="Profile"
                            className="w-32 h-32 rounded-full border-4 border-white transform -translate-y-16 duration-500 transition hover:brightness-150"
                        />
                        <div className="pb-4">
                            <h1 className="text-4xl font-bold text-white">{user.name || 'Unknown User'}</h1>
                            <h1 className="text-2xl">@{user.username}</h1>
                            <p className="text-gray-300 mt-3">
                                Joined {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <motion.div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-slate-800 rounded-xl p-6 shadow-lg">
                            <h2 className="text-xl text-white font-semibold mb-4">Statistics</h2>
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Messages</span>
                                    <span className="font-medium">{user.messageCount || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Friends</span>
                                    <span className="font-medium">{user.friendCount || 0}</span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-slate-800 rounded-xl p-6 shadow-lg">
                            <h2 className="text-xl text-white font-semibold mb-4">Quick Actions</h2>
                            <div className="space-y-3">
                                <button
                                    onClick={() => setShowEditor(true)}
                                    className="toggle-editing w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
                                >
                                    Edit Profile
                                </button>
                                <button className="w-full bg-slate-700 text-white py-2 px-4 rounded-lg hover:bg-slate-600 transition-colors">
                                    Manage Rooms
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-slate-800 rounded-xl p-6 shadow-lg">
                            <h2 className="text-xl font-semibold mb-4">About</h2>
                            <p className="text-gray-300">{user.bio || 'No bio yet.'}</p>
                        </div>
                        <div className="bg-slate-800 rounded-xl p-6 shadow-lg">
                            <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
                            <div className="space-y-4">
                                {!activities || activities.length === 0 ? (
                                    <p className="text-gray-400">No recent activity.</p>
                                ) : (
                                    activities.map((activity, index) => (
                                        <div key={index} className="flex items-center space-x-4 p-3 rounded-lg bg-slate-700">
                                            <i className="material-icons text-indigo-400">{activity.icon || 'question_mark'} </i>
                                            <div>
                                                <p className="text-sm text-gray-300">{activity.description || 'No details'}</p>
                                                <p className="text-xs text-gray-400">{activity.timestamp || 'No given time'}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div id="friends" className="bg-slate-800 px-12 pt-10 pb-16 rounded-xl mt-8 overflow-x-hidden">
                            <h2 className="text-3xl font-bold mb-4">Friends</h2>

                            <nav className="mb-8">
                                <button className={`nav-link mr-2 ${friendsTab === 1 ? 'font-bold' : ''}`} onClick={() => setFriendsTab(1)}>Online</button>
                                <button className={`nav-link mx-2 ${friendsTab === 2 ? 'font-bold' : ''}`} onClick={() => setFriendsTab(2)}>Offline</button>
                                <button className={`nav-link mx-2 ${friendsTab === 3 ? 'font-bold' : ''}`} onClick={() => setFriendsTab(3)}>Requests</button>
                                <button className="mx-2 py-1 px-2 rounded-lg bg-green-600 hover:bg-green-800  transition-all" onClick={() => setShowRequest(true)}>Add Friend</button>
                            </nav>

                            <div className="tab">
                                { friendsTab === 1 && 
                                    friends.map((friend) => (
                                        <div key={friend.id} 
                                            className="flex items-center space-x-4 p-3 
                                                        rounded-lg bg-slate-700 bg-opacity-40 mt-4">
                                            <img src={`/avatar/${friend.id}`} 
                                                    alt="Profile Picture"
                                                    className="inline mr-4 w-10 h-10 rounded-full" />
                                            <h2 className="flex-grow">{friend.name}</h2>

                                            <div onClick={() => createPrivateMessage(friend.id)}
                                                 className="inline-flex items-center justify-center
                                                            w-12 h-12 rounded-full bg-blue-400 bg-opacity-35
                                                            ml-auto cursor-pointer select-none transition 
                                                            duration-300 hover:bg-opacity-80">
                                                <FontAwesomeIcon icon={faComment} size="lg" />
                                            </div>
                                            <button onClick={() => removeFriend(friend.id)} 
                                               className="inline material-icons p-3 rounded-full
                                                        bg-red-600 bg-opacity-35 cursor-pointer 
                                                          select-none transition duration-300 hover:bg-opacity-100">
                                                   close
                                            </button>
                                        </div>
                                    ))
                                }
                                { friendsTab === 2 && 
                                    <div>

                                    </div> 
                                }
                                { friendsTab === 3 && 
                                    <div>
                                    {friendRequests.length === 0 ? (
                                        <p className="text-gray-400 mt-4">
                                            No friend requests.{' '}
                                            <button onClick={() => setShowRequest(true)}
                                                    className="font-bold hover:underline">Click here to send a request</button>
                                        </p>
                                    ) : (
                                            friendRequests.map((request) => (
                                                <div key={request.id} 
                                                     className="flex items-center space-x-4 p-3 
                                                                rounded-lg bg-slate-700 mt-4">
                                                    <img src={`/avatar/${request.id}`} 
                                                         alt="Profile Picture"
                                                         className="inline mx-4 w-10 h-10 rounded-full" />
                                                    <h2 className="flex-grow">{request.name}</h2>

                                                    <a href={`/accept-request/${request.id}`}
                                                       className="inline material-icons p-3 rounded-full
                                                                bg-green-600 bg-opacity-35 ml-auto cursor-pointer
                                                                  select-none transition duration-300 hover:bg-opacity-100">
                                                                    check
                                                    </a>
                                                    <a href={`/deny-request/${request.id}`} 
                                                       className="inline material-icons p-3 rounded-full
                                                                bg-red-600 bg-opacity-35 cursor-pointer 
                                                                  select-none transition duration-300 hover:bg-opacity-100">
                                                                    close
                                                    </a>
                                                </div>
                                            ))
                                    )}
                                </div> }
                            </div>
                        </div>
                        <div id="rooms" className="bg-slate-800 px-12 pt-10 pb-16 rounded-xl mt-8 overflow-x-hidden">
                            <h2 className="text-3xl font-bold mb-8">Rooms</h2>

                            {rooms.length === 0 ? (
                                    <p className="text-gray-400 mt-4">You're not in any rooms.{' '}
                                        <a href="rooms" className="font-bold hover:underline">Click here to explore</a>
                                    </p>
                                ) : (
                                    rooms.map((room) => {
                                        return (
                                            <div key={room.id} className="flex items-center space-x-4 p-3 rounded-lg bg-slate-700 mt-4">
                                                <img src={`${window.location.origin}/${room.id}/icon`} alt="Room Icon" className="inline mx-4 w-10 h-10 rounded-full" />
                                                <div className="inline flex-grow">
                                                    <h2>{room.name}</h2>
                                                    <h3 className="text-sm text-gray-400">By {room.owner}</h3>
                                                </div>

                                                <a href={`/rooms/${room.id}`} className="inline material-icons p-3 rounded-full bg-blue-600 bg-opacity-35 
                                                    ml-auto cursor-pointer select-none transition duration-300 hover:bg-opacity-100">arrow_forward</a>
                                                <button onClick={leaveRoom(room.id, this)} className="inline material-icons p-3 rounded-full bg-red-600 bg-opacity-35
                                                        cursor-pointer select-none transition duration-300 hover:bg-opacity-100">delete</button>
                                            </div>
                                        );
                                    })
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
            
            <AnimatePresence>
                {showEditor && <Editor user={data?.user} onClose={() => setShowEditor(false)} />}
                {showRequest && <FriendRequest showRequest={showRequest} setShowRequest={() => setShowRequest(false)} />}
            </AnimatePresence>
            <Header />
        </div>
    );
};

export default Dashboard;
