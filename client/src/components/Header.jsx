import React, { useContext } from 'react';
import { AuthContext } from '../context/auth';
import { motion, AnimatePresence } from 'motion/react';

const Header = () => {
    const { data, loading } = useContext(AuthContext);

    const user = data?.user || null;

    if (!data || loading) {
        return null;
    }

    return (
        <>
            <section className="m-5 z-5 group fixed transition-all duration-500 ease-in-out w-fit max-w-full 
                    bg-gray-400 bg-opacity-40 backdrop-blur-lg left-1/2 hover:top-[88%] 
                      peer-focus:top-[80%] peer-focus-within:top-[85%] top-full transform -translate-y-5 -translate-x-1/2 
                      p-7 rounded-3xl shadow-xl">
                <div className="absolute -top-6 left-1/2 w-32 bg-gray-400 bg-opacity-40 backdrop-blur-lg
                     rounded-t-3xl rounded-b-[-200px] flex items-center justify-center z-10 
                     transform -translate-x-1/2 -translate-y-4 transition-transform duration-500">
                    <i className="material-icons text-4xl text-white transition-transform duration-500 group-hover:rotate-180">keyboard_arrow_up</i>
                </div>

                <div className="flex justify-center space-x-10">
                    <a href="/"><img src="../images/veltro.png" width="45" className="cursor-pointer" /></a>
                    <a href="/dashboard">
                        <img src={`/avatar/${user.id}`}
                             alt={`${user.username}'s Avatar`} 
                             width="45" height="45"
                             className="cursor-pointer rounded-full" />
                    </a>
                    <a className="material-icons text-4xl text-white" href="/rooms">forum</a>
                    <a className="material-icons text-4xl text-white" href="/friends">group</a>
                    <i className="material-icons text-4xl text-white cursor-pointer">more_horiz</i>
                    <a className="material-icons text-4xl text-white" href="/settings">settings</a>
                    <form action="/logout" method="POST">
                    <button className="material-icons text-4xl text-white" type="submit">logout</button>
                    </form>
                </div>
            </section>
        </>
    );
};

export default Header;