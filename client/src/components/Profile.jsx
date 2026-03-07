import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "motion/react";
import Loading from "../components/Loading";

const Profile = ({ id, showProfile, setShowProfile }) => {
    const [ profileShow, setProfileShow ] = useState(setShowProfile);
    const [ profile, setProfile ] = useState(null);
    const [ loading, setLoading ] = useState(true);
    const [ error, setError ] = useState(null);
    const navigate = useNavigate();
    console.log("Profile ID:", id);

    useEffect(() => {
        async function fetch () {
            try {
                const response = await axios.get(`/api/profile/${id}`, {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                });
                console.log(response.data);
                if (response.data.success) {
                    setProfile(response.data.data);
                    console.log(`Profile fetched from user ${id}:`, response.data.data);
                    setLoading(false);
                } else {
                    console.error(`Failed to fetch profile for user ${id}:`, response.data.message);
                    setError(response.data.message);
                    setProfile(null);
                }
            } catch (err) {
                console.error("Error fetching profile:", err.message);
                setError(err.message);
                setProfile(null);
            } finally {
                setLoading(false);
            }
        }
        
        fetch();
    }, []);

    if (loading) {
        return null;
    }
    console.log("Profile is loading...");
    if (error) {
        console.log("Profile loading error:", error);
        return (
            <div className="fixed top-1/2 left-1/2 text-red-600 px-6 py-4">Error: {error}</div>
        );
    }

    if (!profile) {
        console.log("Profile doesn't exist");
        return null;
    }
    

    console.log("Profile data:", profile);
    return (
        <>
            <motion.div className="fixed top-1/4 left-1/3 bg-black text-white rounded-2xl
                            px-6 py-10 z-50 w-fit max-w-fit"
                                     initial={{ opacity: 0, scale: 0.3, rotateY: -270 }}
                                     animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                                     exit={{ opacity: 0, scale: 0.3, rotateY: -270 }}
                                     transition={{ duration: 0.5, ease: "easeInOut" }}>
                <div className="flex items-start justify-start">
                    <div className="flex items-start p-4 bg-gray-400/20 rounded-xl">
                        <img className="rounded-full ml-4 mr-6" width="60" src={`/avatar/${id}`} alt={`${profile.user?.username}'s Avatar`} />
                        <div className="flex flex-col mr-6">
                            <h2 className="text-xl font-bold text-gray-300">{ profile.user.name || 'Unknown User'}</h2>
                            <a href={`/profile/${id}`} className="text-lg font-bold text-gray-400">@{profile.user.username || 'user#' + id}</a>
                            <p className="block text-base text-white my-6">{profile.user.bio || 'No bio available'}</p>
                            <button class="block bg-indigo-600 hover:bg-indigo-600 rounded-xl p-2">Message</button>
                        </div>
                    </div>
                    <div className="ml-4">
                        <i className="material-icons text-xl text-center cursor-pointer bg-opacity-20 
                        hover:bg-gray-400/20 transition duration-300 rounded-full w-12 h-12 p-2 ml-2">person_add</i>
                        <i className="material-icons text-xl text-center cursor-pointer bg-opacity-20 
                        hover:bg-gray-400/20 transition duration-300 rounded-full w-12 h-12 p-2 ml-2">chat_bubble</i>
                        <i className="material-icons text-xl text-center cursor-pointer bg-opacity-20 
                        hover:bg-gray-400/20 transition duration-300 rounded-full w-12 h-12 p-2 ml-2" 
                            onClick={() => setProfileShow(false)}>close</i>
                    </div>
                </div>
            </motion.div>
        </>
    );
}
export default Profile;