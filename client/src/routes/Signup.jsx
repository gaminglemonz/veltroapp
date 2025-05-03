import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/auth';

const Signup = () => {
    const [ username, setUsername ] = useState("");
    const [ name, setName ] = useState("");
    const [ email, setEmail ] = useState("");
    const [ password, setPassword ] = useState("");
    const [ mode, setMode ] = useState("email");
    const { setData } = useContext(AuthContext);

    const handleSubmit = async (e) => {
        const response = await axios.post("/signup", {
            username, name, email, password
        }, {
            'method': 'POST',
            'headers': {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            }
        });

        console.log("Signup response:", response);
        if (response.data.success) {
            setData(response.data);
            navigate("/dashboard");
        } else {
            setData(null);
            console.error("Signup failed:", response.data.error);
        }
    };

    return (
        <div className="animatedBg">
            <section className="prompt my-[150px] mx-auto py-10 px-36 shadow-lg w-fit max-w-fit rounded-lg bg-white overflow-hidden">
                <form action={handleSubmit} method="POST" className="relative -left-16">
                    <h3 className="text-3xl font-bold mt-4 mb-5">Signup</h3>
                    
                    <label className="block font-bold text-xl" for="email">Email</label>
                    <input
                        onChange={(e) => setEmail(e.target.value)}
                        className="block border border-gray-300 rounded-lg my-4 p-2" id="email" name="email" type="text" autocomplete="username" required />

                    <label className="block font-bold text-xl" for="name">Name</label>
                    <input
                        onChange={(e) => setName(e.target.value)} 
                        className="block border border-gray-300 rounded-lg my-4 p-2" id="name" name="name" type="text" autocomplete="name" required />

                    <label className="block font-bold text-xl" for="username">Username</label>
                    <input
                        onChange={(e) => setUsername(e.target.value)} 
                        className="block border border-gray-300 rounded-lg my-4 p-2" id="username" name="username" type="text" autocomplete="username" required />
                    
                    <label className="block font-bold text-xl" for="new-password">Password</label>
                    <input
                        onChange={(e) => setPassword(e.target.value)}
                        className="block border border-gray-300 rounded-lg my-4 p-2" id="new-password" name='password' type='password' autocomplete='password' required />
                    <button type="submit" className="bg-gray-200 font-bold text-xl my-2 p-5 rounded-md">Signup</button>

                    <div className="grid grid-cols-4 grid-rows-2 gap-4">
                        <div className="border-gray-400 border rounded-lg p-3 flex items-center justify-center">
                            <a href="/login/federated/google" className="flex items-center justify-center">
                                <img src="../images/google.png" alt="Google" className="w-[30px] h-[30px] object-contain" />
                            </a>
                        </div>
                        <div className="border-gray-400 border rounded-lg p-3 flex items-center justify-center">
                            <a className="flex items-center justify-center">
                                <img src="../images/discord.png" alt="Discord" className="w-[30px] h-[30px] object-contain" />
                            </a>
                        </div>
                        <div className="border-gray-400 border rounded-lg p-3">
                            <a><img src="../images/facebook.png" width="30" /></a>
                        </div>
                        <div className="border-gray-400 border rounded-lg p-3">
                            <a><img src="../images/twitter.png" width="30" /></a>
                        </div>
                        <div className="border-gray-400 border rounded-lg p-3">
                            <a><img src="../images/apple_black.png" width="30" /></a>
                        </div>
                        <div className="border-gray-400 border rounded-lg p-3">
                            <a><img src="../images/microsoft.png" width="30" /></a>
                        </div>
                        <div className="border-gray-400 border rounded-lg p-3">
                            <a><img src="../images/twitch.png" width="30" /></a>
                        </div>
                        <div className="border-gray-400 border rounded-lg p-3">
                            <a><img src="../images/github.png" width="30" /></a>
                        </div>
                    </div>
                </form>
                <div className="relative -left-16">
                    <p className="font-bold mt-4">Have an account?<a href="/login" className=" text-indigo-600"> Log back in</a></p>
                    <a href='/' className="font-bold cursor-pointer"><i className="material-icons mt-5 font-bold cursor-pointer mr-2" title="Back to Home">arrow_back</i></a>
                </div>
            </section>
            <footer className="info text-white font-bold">
                <p>Authentication powered by <a href="https://www.passportjs.org" target="_blank">Passport</a></p>
            </footer>
        </div>
    );
};

export default Signup;