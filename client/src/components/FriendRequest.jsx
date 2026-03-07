import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/auth';
import { motion, AnimatePresence } from 'motion/react';

const FriendRequest = ({ showRequest, setShowRequest }) => {
    const [ previewUsername, setPreviewUsername ] = useState(null);
    const [ previewName, setPreviewName ] = useState(null);
    const [ previewAvatar, setPreviewAvatar ] = useState(null);
    const [ previewUser, setPreviewUser ] = useState(null);
    const [ previewID, setPreviewID ] = useState(null);
    const [ username, setUsername ] = useState(null);
    const { setData } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            
            const response = await axios.post(`/friend-request/${previewID}`, {
                withCredentials: 'include',
            });
            if (response.data.success) {
                console.log(response.data);
                navigate('/dashboard');
            }
        } catch (err) {
            console.error('Error sending friend request:', err.message);
        }
    }
    const handlePreview = async () => {
        try {
            const response = await axios.get(`/api/user/${username}`, {
                withCredentials: 'include',
            });
            console.log("User preview response:", response);
            if (response.data.success) {
                setPreviewID(response.data.user.id);
                setPreviewUsername(response.data.user.username);
                setPreviewName(response.data.user.name);
                setPreviewAvatar(response.data.user.avatar);
            } else {
                console.error('Error fetching user preview:', response.data.error);
            }
        } catch (err) {
            console.error('Error fetching user preview:', err.message);
        }
    }

    return (
        <>
            <motion.div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}>
                <motion.div className="bg-slate-800 p-8 rounded-xl max-w-md w-full" 
                     initial={{ opacity: 0, y: 20 }}             
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: 20 }}
                     transition={{ duration: 0.3, y: { type: "spring", bounce: 0.5 } }}>
                    <h2 className="text-2xl font-bold mb-6">Send Friend Request</h2>
                    <form onSubmit={handleSubmit}>
                        
                        <div className="mb-4">
                            <label className="block font-bold mb-2">Username</label>
                            <span className="inline-flex items-center space-x-2">
                                <p className="text-xl">@</p>
                                <input type="text" 
                                    value={username}
                                    onChange={(e) => {handlePreview(); setUsername(e.target.value);}}
                                    className="w-full p-3 rounded-lg bg-slate-700" required />
                            </span>
                        </div>

                        { previewUsername && (
                            <div className="flex items-center space-x-4 p-3 
                                            rounded-lg bg-slate-700 bg-opacity-40 mt-4">
                                <img src={`/avatar/${previewID}`} 
                                     alt="Profile Picture"
                                     className="inline mr-4 w-10 h-10 rounded-full" />
                                <h2 className="flex-grow">{previewName}</h2>
                                <button className="inline material-icons p-3 rounded-full
                                                 bg-green-600 bg-opacity-35 ml-auto cursor-pointer
                                                   select-none transition duration-300 hover:bg-opacity-100">check</button>
                                <button onClick={() => createPrivateMessage(previewID)}
                                     className="inline-flex items-center justify-center
                                                w-12 h-12 rounded-full bg-blue-400 bg-opacity-35
                                                ml-auto cursor-pointer select-none transition 
                                                duration-300 hover:bg-opacity-80">
                                    <FontAwesomeIcon icon={faComment} size="lg" />
                                </button>
                            </div>
                        )}

                        <div className="flex space-x-4">
                            <button type="button"
                                    onClick={() => setShowRequest(false)}
                                    className="px-4 py-2 bg-slate-600 rounded-lg hover:bg-slate-700">Cancel</button>
                            <button type="submit"
                                    className="px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-700">Send Request</button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </>
    );
};

export default FriendRequest;