import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/auth";
import axios from 'axios';

const Login = () => {
    const [ username, setUsername ] = useState("");
    const [ password, setPassword ] = useState("");
    const [ error, setError ] = useState(""); 
    const navigate = useNavigate();
    const { setData } = useContext(AuthContext);

    const handleErrors = (err) => {
        if (err.includes("401")) {
            return "Invalid username or password. Please try again.";
        } else {
            return err;
        }
    }
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post("/login/password", {
                username, password,
            }, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Acccept": "application/json",
                },
            });

            console.log("Login Response:", response)
            setData(response.data);
            navigate("/dashboard");
        } catch (err) {
            console.error("Error logging in:", err.message);
            setError("Login failed: " + err.message);
        }
    };

    return (
        <div className="animatedBg">
            <section className="prompt my-[180px] mx-auto p-10 shadow-lg w-96 rounded-lg bg-white">
                <form onSubmit={handleSubmit}>
                    <h1 className="text-center text-4xl font-bold mb-6">Login</h1>

                    <label className="block font-bold text-2xl" htmlFor="username">Username</label>
                    <input className="block border border-gray-300 rounded-lg my-4 p-2"
                        value={username}  name="username" onChange={(e) => setUsername(e.target.value)} required />

                    <label className="block font-bold text-2xl" htmlFor="current-password">Password</label>
                    <input type="password" className="block border border-gray-300 rounded-lg my-4 p-2" value={password} name="password"
                        onChange={(e) => setPassword(e.target.value)}
                        required />

                    <button type="submit" className="bg-gray-200 font-bold text-xl my-2 p-5 rounded-md" title="Login" >Login</button>
                    {error && <p className="text-red-500">{handleErrors(error)}</p>}
                </form>
                <p className="font-bold mt-4">Don't have an account?{" "}<a href="/signup" className="text-indigo-600">Join Today</a></p>
                <a href="/" className="font-bold cursor-pointer"><i className="material-icons mt-5 font-bold cursor-pointer mr-2" title="Back">arrow_back</i></a>
            </section>
            <footer className="info text-white font-bold px-10 py-7">
                <p>Authentication powered by{" "} <a href="https://www.passportjs.org" target="_blank" rel="noreferrer">Passport</a></p>
            </footer>
        </div>
    );
};

export default Login;