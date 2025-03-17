import React, { createContext, useState, useEffect } from 'react';

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
    const [ user, setUser ] = useState(null);
    // const [ friendRequests, setFriendRequests ] = useState([]);
    // const [ friends, setFriends ] = useState([]); 
    const [ loading, setLoading ] = useState(true);

    useEffect(async () => {
        console.log("Checking authentication state...");
        await fetch('/api/user', {
            credentials: 'include',
            method: "GET",
            mode: "cors",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
        })
        .then(async res => { // running
            console.log("Auth response status:", res.status);
            console.log("Auth response headers:", Object.fromEntries(res.headers.entries()));
            
            // Debug: log the actual response text if it's not JSON
            const text = await res.text();
            try {
                const data = JSON.parse(text);
                console.log("Parsed response data:", data);
                return data;
            } catch (e) {
                console.error("Response was not JSON:", e.message, text.substring(0, 500));
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