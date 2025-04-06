import React, { useEffect, useContext, useState } from 'react';
import Header from '../components/Header';
import Editor from '../components/Editor';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/auth';

const Dashboard = () => {
    const { data, loading } = useContext(AuthContext);
    const navigate = useNavigate();
    const [ showEditor, setShowEditor ] = useState(false);

    const user = data?.user || null;
    const friends = data?.friends || [];
    const friendRequests = data?.friendRequests || [];
    const activityTypeToIcon = {
        "message": "chat_bubble",
        "joined_room": "group_add",
        "left_room" : "group_remove",
    };

    console.log("Received data:", data);

    useEffect(() => {
        if (!loading && !data) {
            navigate('/login');
        }
    }, [data, loading, navigate]);

    if (loading) {
        return (
            <div className="bg-slate-900 h-screen flex items-center justify-center">
                <div className="text-white text-2xl font-bold">Loading...</div>
                <div className="bg-white h-1 w-1 rounded-full animate-ping absolute"></div>
            </div>
        );
    }

    if (!user) {
        console.log("User object not found. Defined as", user);
        return (
            <div className="bg-slate-900 h-screen flex items-center justify-center">
                <div>User not found. Redirecting...</div>
            </div>
        );
        navigate("/dashboard");
    }

    return (
        <>
            <div className="relative h-64 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                <div className="absolute bottom-0 left-0 right-0 px-8 py-4 bg-black bg-opacity-40">
                    <div className="relative left-10 flex items-end space-x-6">
                        <img
                            src={`/avatar/${user.id}`}
                            alt="Profile"
                            className="w-32 h-32 rounded-full border-4 border-white transform -translate-y-16 duration-500 transition hover:brightness-150"
                        />
                        <div className="pb-4">
                            <h1 className="text-4xl font-bold text-white">{user.name || 'Unknown User'}</h1>
                            <h1 className="text-2xl text-white">@{user.username}</h1>
                            <p className="text-gray-300 mt-3">
                                Joined {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
                                            <i className="material-icons text-indigo-400">{activity.icon}</i>
                                            <div>
                                                <p className="text-sm text-gray-300">{activity.description}</p>
                                                <p className="text-xs text-gray-400">{activity.timestamp}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="bg-slate-800 rounded-xl p-6 shadow-lg">
                            <h2 className="text-xl font-semibold mb-4">My Rooms</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {user.rooms && user.rooms.length === 0 ? (
                                    <p className="text-gray-400">No rooms yet.</p>
                                ) : (
                                    user.rooms.map((room) => (
                                        <div key={room.id} className="flex items-center space-x-3 p-3 rounded-lg bg-slate-700">
                                            <img src={room.icon} alt="Room Icon" className="w-10 h-10 rounded-full" />
                                            <div>
                                                <h3 className="font-medium">{room.name}</h3>
                                                <p className="text-sm text-gray-400">{room.memberCount} members</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                        <div id="friends" className="bg-slate-800 px-12 pt-10 pb-16 rounded-xl mt-8 overflow-x-hidden">
                            <h2 className="text-3xl font-bold mb-8">Friends</h2>

                            <nav>
                                <a className="nav-link" href="javascript:nav(1)">Online</a>
                                <a className="nav-link" href="javascript:nav(2)">Offline</a>
                                <a className="nav-link" href="javascript:nav(3)">Requests {friendRequests.length > 0 && `(${friendRequests.length})`}</a>
                            </nav>

                            <div className="tab">
                                {friendRequests.length === 0 ? (
                                    <p className="text-gray-400 mt-4">No friend requests.</p>
                                ) : (
                                    friendRequests.map((request) => (
                                        <div key={request.id} className="flex items-center space-x-4 p-3 rounded-lg bg-slate-700 mt-4">
                                            <img src={`/avatar/${request.id}`} alt="Profile Picture" className="inline mx-4 w-10 h-10 rounded-full" />
                                            <h2 className="flex-grow">{request.name}</h2>

                                            <a href={`/accept-request/${request.id}`} className="inline material-icons p-3 rounded-full bg-green-600 bg-opacity-35 ml-auto cursor-pointer select-none transition duration-300 hover:bg-opacity-100">check</a>
                                            <a href={`/deny-request/${request.id}`} className="inline material-icons p-3 rounded-full bg-red-600 bg-opacity-35 cursor-pointer select-none transition duration-300 hover:bg-opacity-100">close</a>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showEditor && <Editor user={data} onClose={() => setShowEditor(false)} />}
            <Header />
        </>
    );
};

export default Dashboard;
