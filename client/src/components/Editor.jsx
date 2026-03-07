import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/auth';
import { motion, AnimatePresence } from 'motion/react';

const Editor = ({ user, onClose }) => {
    const [ avatar, setAvatar ] = useState(null);
    const [ preview, setPreview ] = useState(null);
    const [ username, setUsername ] = useState(user.username);
    const [ name, setName ] = useState(user.name);
    const [ bio, setBio ] = useState(user.bio);
    const { setData } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleImagePreview = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatar(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            if (avatar) formData.append('avatar', avatar);
            formData.append('username', username);
            formData.append('name', name);
            formData.append('bio', bio);
            
            const response = await axios.post(`/update-profile/${user.id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Accept': 'application/json',
                },
                withCredentials: 'include',
            });
            console.log(avatar);
            if (response.data.success) {
                onClose();
                console.log(response.data);
                setData(response.data);
                navigate('/dashboard');
            }
        } catch (err) {
            console.error('Error updating profile:', err.message);
        }
    };

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
                     transition={{ duration: 0.3, y: { type: "spring", bounce: 0.7 } }}>
                    <h2 className="text-2xl font-bold mb-6">Edit Profile</h2>
                    <form onSubmit={handleSubmit} enctype="multipart/form-data">
                        <div className="mb-6">
                            <label className="block font-bold mb-2">Profile Picture</label>
                            <div className="flex items-center space-x-4">
                                <img src={preview || `/avatar/${user.id}`}
                                     alt="Profile" 
                                     className="w-20 h-20 rounded-full"  />
                                <label htmlFor="avatar" className="upload-button">
                                    <input name="avatar"
                                           id="avatar"
                                           type="file"
                                           accept="image/*"
                                           onChange={handleImagePreview}
                                           className="text-sm" />
                                    <i className="material-icons">cloud_upload</i>
                                </label>
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block font-bold mb-2">Name</label>
                                <input type="text" 
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full p-3 rounded-lg bg-slate-700" required/>
                        </div>
                        <div className="mb-4">
                            <label className="block font-bold mb-2">Username</label>
                            <span className="inline-flex items-center space-x-2">
                                <p className="text-xl">@</p>
                                <input type="text" 
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)} 
                                    className="w-full p-3 rounded-lg bg-slate-700" required />
                            </span>
                        </div>
                        <div className="mb-4">
                            <label className="block font-bold mb-2">Bio</label>
                            <textarea placeholder="say something about yourself..."
                                      value={bio} onChange={(e) => setBio(e.target.value)} 
                                      className="w-full p-2 rounded-lg bg-slate-700"></textarea>
                        </div>

                        <div className="flex justify-end space-x-4">
                            <button type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 bg-slate-600 rounded-lg hover:bg-slate-700">Cancel</button>
                            <button type="submit"
                                    className="px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-700">Save Changes</button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </>
    );
};

export default Editor;