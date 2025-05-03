import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/auth';

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
            const response = await axios.post(`/update-profile/${user.id}`, {
                avatar, username, name, bio
            }, {
                withCredentials: 'include',
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Accept': 'application/json',
                },
            });
            
            if (response.data.success) {
                onClose();
                setData(response.data);
                navigate('/dashboard');
            }
        } catch (error) {
            console.error('Error updating profile:', error.message);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white">
            <div className="bg-slate-800 p-8 rounded-xl max-w-md w-full">
                <h2 className="text-2xl font-bold mb-6">Edit Profile</h2>
                
                <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                        <label className="block font-bold mb-2">Profile Picture</label>
                        <div className="flex items-center space-x-4">
                            <img src={preview || `/avatar/${user.id}`} alt="Profile" className="w-20 h-20 rounded-full"  />
                            <label for="avatar" class="upload-button">
                                <input name="avatar" type="file" accept="image/*" onChange={handleImagePreview} className="text-sm" />
                                <i class="material-icons">cloud_upload</i>
                            </label>
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="block font-bold mb-2">Name</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 rounded bg-slate-700"required/>
                    </div>

                    <div className="mb-4">
                        <label className="block font-bold mb-2">Username</label>
                        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full p-2 rounded bg-slate-700" required />
                    </div>

                    <div className="mb-4">
                        <label className="block font-bold mb-2">Bio</label>
                        <textarea placeholder="write something cool about yourself..." value={bio} onChange={(e) => setBio(e.target.value)} className="w-full p-2 rounded bg-slate-700"></textarea>
                    </div>

                    <div className="flex justify-end space-x-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-600 rounded hover:bg-slate-700">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 rounded hover:bg-indigo-700">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Editor;