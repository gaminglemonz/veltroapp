import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const PrivateRoomLogin = ({ show, setShowLogin }) => {
    const [ password, setPassword ] = useState('');
    const [ ID, setID ] = useState(null);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(`/room-login/`, { ID, password }, {
                withCredentials: 'include',
            });
            
            if (response.data.success) {
                navigate(`/room/${response.data.id}`);
            } else {
                console.error('Error logging into room:', response.data.error);
            }
        } catch (err) {
            console.error('Error updating profile:', err.message);
        }
    };

    return (
        <>
            <motion.div className="fixed inset-0 text-white bg-black bg-opacity-50 
                            flex items-center justify-center"
                         initial={{ opacity: 0 }}
                         animate={{ opacity: 1 }}
                         exit={{ opacity: 0 }}
                         transition={{ duration: 0.5 }}>
                { show && (
                    <motion.div className="bg-slate-800 p-8 rounded-xl max-w-md w-full"
                                initial={{ opacity: 0, y: 20 }}             
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                transition={{ duration: 0.3, y: { type: "spring", bounce: 0.7 } }}>
                        <h2 className="text-2xl font-bold mb-6">Login To Private Room</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-6">
                                <label className="block font-bold mb-2">Room ID</label>
                                <span className="flex items-center space-x-2">
                                    <p className="text-xl">#</p>
                                    <input required type="number" 
                                        onChange={(e) => setID(e.target.value)} 
                                        className="w-fit p-2 rounded bg-slate-700" />
                                </span>
                            </div>
                            <div className="mb-6">
                                <label className="block font-bold mb-2">Password</label>
                                <input required type="text" 
                                       value={password}
                                       onChange={(e) => setPassword(e.target.value)} 
                                       className="w-full p-2 rounded bg-slate-700" />
                            </div>

                            <div className="flex justify-end space-x-4">
                                <button type="button" 
                                        onClick={() => setShowLogin(false)}
                                        className="px-4 py-2 bg-slate-600 rounded hover:bg-slate-700">Cancel</button>
                                <button type="submit" 
                                        className="px-4 py-2 bg-indigo-600 rounded hover:bg-indigo-700">Enter</button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </motion.div>
        </>
    );
};

export default PrivateRoomLogin;