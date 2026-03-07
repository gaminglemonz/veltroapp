import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';

const CreateRoom = () => { 
    useEffect(() => {
        document.title = "Create New Room";
    }, []);

    const [ name, setName ] = useState('');
    const [ description, setDescription ] = useState('');
    const [ type, setType ] = useState('');
    const [ password, setPassword ] = useState('');
    const [ visibility, setVisibility ] = useState('Public');
    const [ icon, setIcon ] = useState(null);
    const [ banner, setBanner ] = useState(null);
    const [ iconPreview, setIconPreview ] = useState(null);
    const [ bannerPreview, setBannerPreview ] = useState(null);
    const navigate = useNavigate();
    
    const handleIconPreview = (e) => {
        const file = e.target.files[0];
        if (file) {
            setIcon(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setIconPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    }
    const handleBannerPreview = (e) => {
        const file = e.target.files[0];
        if (file) {
            setBanner(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setBannerPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    }
    const handleSubmit = async (e) => {
        e.preventDefault();
     
        try {
            const formInfo = new FormData();
            formInfo.append('name', name);
            formInfo.append('description', description);
            formInfo.append('type', type);
            formInfo.append('visibility', visibility);
            if (visibility === 'private') {
                formInfo.append('password', password);
            }
            if (icon) {
                formInfo.append('icon', icon);
            }
            if (banner) {
                formInfo.append('banner', banner);
            }
    
            [...formInfo.entries()].forEach(([k, v]) => console.log(k, v));
            const response = await axios.post('/api/create-room', formInfo, {
                withCredentials: true,
            });
            
            if (response.data.success) {
                navigate(`/rooms/${response.data.id}`);
            } else {
                console.error('Error creating room:', response.data.error);
            }
        } catch (err) {
            console.error('Error creating room:', err.message);
        }
    }

    return (
        <div className="p-10 bg-slate-900 flex items-center justify-center text-white">
            <div className="bg-slate-800 p-8 rounded-xl max-w-md w-full">
                <h2 className="text-2xl font-bold mb-6">Create New Room</h2>

                <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                        <label className="block font-bold mb-2">Room Icon</label>
                        <div className="flex items-center space-x-4">
                            <img src={iconPreview || '../images/default-room-icon.png'} alt="Room Icon" 
                                 className="w-20 h-20 rounded-full" />
                            <label htmlFor="icon" className="upload-button">
                                <input id="icon" name="icon" type="file" accept="image/*" 
                                        onChange={handleIconPreview} className="text-sm" />
                                <i className="material-icons">cloud_upload</i>
                            </label>
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="block font-bold mb-2">Room Banner</label>
                        <div className="flex items-center space-x-4">
                            <img src={bannerPreview || '../images/default-room-banner.jpg'} alt="Room Banner"
                                className="w-40 h-20 rounded-lg object-cover" />
                            <label htmlFor="banner" className="upload-button">
                                <input id="banner" name="banner" type="file" accept="image/*"
                                    onChange={handleBannerPreview}
                                    className="text-sm" />
                                <i className="material-icons">cloud_upload</i>
                            </label>
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="block font-bold mb-2">Room Name</label>
                        <input required type="text" value={name}
                               onChange={(e) => setName(e.target.value)} className="w-full p-2 rounded bg-slate-700" />
                    </div>

                    <div className="mb-6">
                        <label className="block font-bold mb-2">Description</label>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} 
                                   className="w-full p-2 rounded bg-slate-700 min-h-min max-h-52"></textarea>
                    </div>

                    <div className="mb-6">
                        <label className="block font-bold mb-2">Type</label>
                        <select required value={type} onChange={(e) => setType(e.target.value)}  className="w-full p-2 rounded bg-slate-700">
                            <option value="">Select a type</option>
                            <option value="Gaming">Gaming</option>
                            <option value="Friends">Friends</option>
                            <option value="Academics">Academics</option>
                            <option value="Web and App Development">Web and App Development</option>
                            <option value="Work and Business">Work and Business</option>
                        </select>
                    </div>

                    <div className="mb-6">
                        <label className="block font-bold mb-2">Visibility</label>
                        <select required value={visibility} onChange={(e) => setVisibility(e.target.value)}
                            className="w-full p-2 rounded bg-slate-700">
                            <option value="public">Public</option>
                            <option value="private">Private</option>
                        </select>
                    </div>

                    { visibility === 'private' ? (
                        <div className="mb-6">
                            <label className="block font-bold mb-2">Password</label>
                            <input required type="text" 
                                value={password}
                                placeholder="recommended for friend groups"
                                onChange={(e) => setPassword(e.target.value)} 
                                className="w-full p-2 rounded bg-slate-700" />
                        </div>
                    ) : null }

                    <div className="flex justify-end space-x-4">
                        <button type="button" onClick={() => navigate('/rooms')}
                                className="px-4 py-2 bg-slate-600 rounded hover:bg-slate-700">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 rounded hover:bg-indigo-700">Create Room</button>
                    </div>
                </form>
            </div>

            <Header />
        </div>
    );
};

export default CreateRoom;