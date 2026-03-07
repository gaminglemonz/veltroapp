import React, { useRef } from 'react';
import Footer from '../components/Footer';

const Home = () => {
    const scrollBody = useRef(null);

    const scrollToBottom = () => {
        scrollBody?.current.scrollIntoView({ behavior: 'smooth' });
    }
    const findOS = () => {
        const agent = window.navigator.userAgent;
        if (agent.indexOf('Windows') !== -1) return "Windows"
        if (agent.indexOf('Mac') !== -1) return "Mac"
        if (agent.indexOf('Linux') !== -1) return "Linux"
        if (agent.indexOf('Android') !== -1) return "Android"
        if (agent.indexOf('iOS') !== -1) return "iOS"
        if (agent.indexOf('ChromeOS') !== -1) return "ChromeOS"
        return "Linux";
    }
    const osIcon = {
        "Windows" : "../images/windows.png",
        "Mac" : "../images/apple.png",
        "iOS" : "../images/apple.png",
        "Linux" : "../images/linux.png",
        "Android" : "../images/android.png",
        "ChromeOS" : "../images/chrome.png",
    };

    return (
        <div className="bg-slate-900 text-white overflow-x-hidden m-0">
            <section 
                style={{ backgroundImage: "url('../images/parallax.jpg')", backgroundSize: "cover", backgroundAttachment: "fixed" }} 
                className="min-h-screen flex items-center justify-center relative text-white">
                <div className="absolute inset-0 bg-black bg-opacity-50"></div>
                <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8">
                    <h1 className="title text-5xl md:text-5xl lg:text-7xl font-bold text-white mb-8">
                        Connect Instantly<br/>
                        <span className="text-indigo-400">Anywhere, Anytime</span>
                    </h1>
                    <p className="text-xl sm:text-2xl text-gray-200 mb-12 max-w-3xl mx-auto">
                        Experience real-time messaging with crystal-clear quality and unmatched security.
                    </p>
                    <div className="space-x-4">
                        <a href="/signup" className="inline-block bg-indigo-600 text-white font-semibold px-8 py-4 rounded-lg transform transition duration-300 hover:scale-105 hover:bg-indigo-700">Get Started Free</a>
                        <a href="/login" className="inline-block bg-white text-slate-900 font-semibold px-8 py-4 rounded-lg transform transition duration-300 hover:scale-105 hover:bg-gray-100">Sign In</a>
                    </div>
                </div>
                <button id="scroll" onClick={scrollToBottom}
                className="material-icons rounded-full absolute top-[85%] p-4
                bg-transparent text-white text-4xl text-center
                transition-all duration-300 hover:bg-gray-400 hover:bg-opacity-35 cursor-pointer select-none">keyboard_arrow_down</button>
            </section>

            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-800 select-none" ref={scrollBody}>
                <div className="max-w-7xl mx-auto">
                    <h2 className="title text-3xl sm:text-4xl font-bold text-center mb-16">Why Choose Veltro?</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        <div className="text-center p-6 rounded-xl bg-slate-700 transform transition duration-300 hover:scale-105">
                            <i className="material-icons text-5xl text-indigo-400 mb-4">speed</i>
                            <h3 className="text-xl font-semibold mb-4">Lightning Fast</h3>
                            <p className="text-gray-300">Real-time messaging with minimal latency</p>
                        </div>
                        <div className="text-center p-6 rounded-xl bg-slate-700 transform transition duration-300 hover:scale-105">
                            <i className="material-icons text-5xl text-indigo-400 mb-4">security</i>
                            <h3 className="text-xl font-semibold mb-4">Secure</h3>
                            <p className="text-gray-300">End-to-end encryption for your privacy</p>
                        </div>
                        <div className="text-center p-6 rounded-xl bg-slate-700 transform transition duration-300 hover:scale-105">
                            <i className="material-icons text-5xl text-indigo-400 mb-4">devices</i>
                            <h3 className="text-xl font-semibold mb-4">Cross Platform</h3>
                            <p className="text-gray-300">Available on all your devices</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900 w-full" id="download">
                <h2 className="title text-3xl sm:text-4xl font-bold text-center mb-8">Download For</h2>
                <a download href='error.ejs' className="mx-auto flex align-center w-fit max-w-fit p-7 rounded-2xl font-bold 
                text-xl text-white bg-indigo-600 hover:bg-indigo-700 transition transform duration-500 hover:scale-105">
                    <img src={`${osIcon[findOS()]}`} id="OS-icon" width="20" className="inline mx-3" /> <span id='OS'>{findOS()}</span>
                </a>
                <p className="text-center font-bold text-gray-400 mt-7 cursor-pointer" id="alt-downloads">Other downloads...</p>
            </section>

            <section id='download-options' className="fixed top- bg-slate-900 hidden py-20 px-4 sm:px-6 lg:px-8">
                <h1 className="font-bold md:text-5xl lg:text-7xl mb-16">Other Download Options</h1>
            </section>

            <Footer />
        </div>
    )
};

export default Home;
