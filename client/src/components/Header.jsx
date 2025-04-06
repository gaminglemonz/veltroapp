import React, { useContext } from 'react';
import { AuthContext } from '../context/auth';

const Header = () => {
    const { data, loading } = useContext(AuthContext);

    const user = data?.user || null;

    if (!data || loading) {
        return null;
    }

    const header = 
    <>
        <section className="z-50 group fixed transition-all duration-500 w-fit max-w-full bg-gray-400 bg-opacity-40 backdrop-blur-lg left-1/2 hover:top-[87%] peer-focus:top-[85%] peer-focus-within:top-[85%] top-full transform -translate-x-1/2 p-10 rounded-3xl shadow-xl">
        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 -translate-y-4 w-32 bg-gray-400 bg-opacity-40 backdrop-blur-lg rounded-t-3xl rounded-b-[-200px] flex items-center justify-center z-10">
            <i className="material-icons text-4xl text-white transform transition-transform duration-500 group-hover:rotate-180">keyboard_arrow_up</i>
        </div>

        <div class="flex justify-center space-x-10 overflow-x-scroll">
            <a href="/"><img src="../images/veltro.png" width="45" className="cursor-pointer" /></a>
            <a className="material-icons text-5xl text-white" href="/rooms">forum</a>
            <a className="material-icons text-5xl text-white" href="/settings">settings</a>
            <a className="material-icons text-5xl text-white" href="/friends">group</a>
            <a href="/dashboard"><img src={`/avatar/${user.id}`} alt={`${user.username}'s Avatar`} width="45" className="cursor-pointer rounded-full" /></a>
            <i className="material-icons text-5xl text-white cursor-pointer">more_horiz</i>
            <form action="/logout" method="POST">
            <button className="material-icons text-5xl text-white" type="submit">logout</button>
            </form>
        </div>
    </section>
    </>;

    return header;
};

export default Header;