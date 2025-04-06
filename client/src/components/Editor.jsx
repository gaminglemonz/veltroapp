import React, { useState } from 'react';
import { useNavigate, useContext } from 'react-router-dom';
import { AuthContext } from '../context/auth';

const EditProfile = ({ user, onClose }) => {
    const { data, loading } = useContext(AuthContext);
    const user = data?.user || null; 

    const [avatar, setAvatar] = useState(null);
    const [preview, setPreview] = useState(null);
    const [username, setUsername] = useState(user.username);
    const [name, setName] = useState(user.name);
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
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        if (avatar) formData.append('avatar', avatar);
        formData.append('username', username);
        formData.append('name', name);

        try {
            const response = await fetch('/update-profile', {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });
            
            if (response.ok) {
                onClose();
                navigate('/dashboard');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
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
                            <input type="file" accept="image/*" onChange={handleImagePreview} className="text-sm" />
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block font-bold mb-2">Username</label>
                        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full p-2 rounded bg-slate-700" required />
                    </div>

                    <div className="mb-6">
                        <label className="block font-bold mb-2">Name</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 rounded bg-slate-700"required/>
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

export default EditProfile;