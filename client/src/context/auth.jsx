import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
    const [ user, setUser ] = useState(null);
    // const [ friendRequests, setFriendRequests ] = useState([]);
    // const [ friends, setFriends ] = useState([]); 
    const [ loading, setLoading ] = useState(true);

    useEffect(() => {
        console.log("Checking authentication state...");

        async function fetch () {
            await axios.get('/api/user', {
                credentials: 'include',
                method: "GET",
                mode: "cors",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
            })
            .then(async res => {
                console.log("Auth response status:", res.status);
                
                const data = res.json();
                try {
                    console.log("Response data:", data);
                    return data;
                } catch (e) {
                    console.error("Response was not JSON:", e.message, data);
                    throw new Error('Server returned invalid JSON');
                }
            })
            .then(data => {
                console.log("Received data: ", data);
                if (data.success) {
                    setUser(data.user);
                    // setFriends(Array.isArray(data.friends) ? data.friends : []);
                    // setFriendRequests(Array.isArray(data.friendRequests) ? data.friendRequests : []);
                } else {
                    console.error(data.error || "Invalid response format");
                }
            })
            .catch(err => {
                console.error('Auth error:', err);
                setUser(null);
                // setFriends([]);
                // setFriendRequests([]);
            })
            .finally(() => {
                setLoading(false);
            });
        }

        fetch();
    }, []);

    const value = {
        user, setUser,
        // friends, setFriends,
        // friendRequests, setFriendRequests,
        loading
    };
    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export { AuthContext };
export default AuthProvider;