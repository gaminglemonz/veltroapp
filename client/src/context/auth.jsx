import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
    const [ data, setData ] = useState(null);
    const [ loading, setLoading ] = useState(true);
    const [ error, setError ] = useState(null);

    useEffect(() => {
        async function fetch () {
            try {
                const response = await axios.get('/user',{
                    withCredentials: true,
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                });
                console.log("Auth Response:", response);
                         
                if (response.data.success) {
                    setData(response.data.data);
                } else {
                    setData(null);
                    console.error("Unsuccessful response:", response.data.message);
                }
            } catch (err) {
                console.error("Error fetching user data:", err.message);
                setData(null);
                setError(err);
            } finally {
                setLoading(false);
            }
        }

        fetch();
    }, []);

    const value = {
        data, setData,
        error, setError,
        loading, setLoading
    };
    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export { AuthContext };
export default AuthProvider;