import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/auth";
import axios from 'axios';
import "../index.css";

const Login = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const { setUser } = useContext(AuthContext);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.get("api/login/password", {
                method: "POST",
                headers: { 
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ username, password }),
                credentials: "include",
            });
            const data = await response.json();

            if (response.ok && data.success) {
                setUser(data.user);
                // setFriends(data.friends);
                // setFriendRequests(data.friendRequests);
                navigate("/dashboard");
            } else {
                setError(data.message || "Login failed");
            }
        } catch (err) {
            console.error("Error logging in:", err.message);
            setError("Login failed: " + err.message);
        }
    };

    return (
        <>
            <section className="prompt my-[180px] mx-auto p-10 shadow-lg w-96 rounded-lg bg-white">
                <form onSubmit={handleSubmit}>
                    <h1 className="text-center text-4xl font-bold my-4">Login</h1>

                    <label className="block font-bold text-2xl" htmlFor="username">Username</label>
                    <input className="block border border-gray-300 rounded-lg my-4 p-2"
                        value={username}  name="username" onChange={(e) => setUsername(e.target.value)} required />

                    <label className="block font-bold text-2xl" htmlFor="current-password">Password</label>
                    <input type="password" className="block border border-gray-300 rounded-lg my-4 p-2" value={password} name="password"
                        onChange={(e) => setPassword(e.target.value)}
                        required />

                    <button type="submit" className="bg-gray-200 font-bold text-xl my-2 p-5 rounded-md" title="Login" >Login</button>
                    {error && <p className="text-red-500">{error}</p>}
                </form>
                <p className="font-bold mt-4">Don't have an account?{" "}<a href="/signup" className="text-indigo-600">Join Today</a></p>
                <a href="/" className="font-bold cursor-pointer"><i className="material-icons mt-5 font-bold cursor-pointer mr-2" title="Back">arrow_back</i></a>
            </section>
            <footer className="info text-white font-bold">
                <p>Authentication powered by{" "} <a href="https://www.passportjs.org" target="_blank" rel="noreferrer">Passport</a></p>
            </footer>
        </>
    );
};

export default Login;
