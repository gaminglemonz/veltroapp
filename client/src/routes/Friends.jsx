import React, { useContext, useEffect, useState } from 'react';
import Header from '../components/Header';
import Loading from '../components/Loading';
import { AuthContext } from '../context/auth';

const Friends = () => {
    const { data, loading } = useContext(AuthContext);
    const friends = data?.friends || [];
    const friendRequests = data?.friendRequests || [];

    if (loading || !data) {
        return (
            <Loading />
        );
    }

    return (
        <div className="bg-slate-900 text-white">
            <div className="relative h-64 bg-gradient-to-br from-indigo-600 from-10% via-sky-500 via-50% to-emerald-600 to-90% overflow-x-hidden">                <div className="absolute bottom-0 left-0 right-0 px-8 py-4 bg-black bg-opacity-40">
                    <div className="relative left-10 flex items-end space-x-6">
                        <div className="w-32 h-32 rounded-full border-4 border-white bg-transparent flex items-center justify-center transform -translate-y-16 duration-500 transition hover:scale-110 cursor-default">
                            <i className="material-icons text-6xl text-white">forum</i>
                        </div>
                        <div className="pb-4">
                            <h1 className="text-4xl font-bold text-white">Friends</h1>
                            <h1 className="text-xl mt-2">Manage your friends and friend requests here</h1>
                        </div>
                    </div>
                </div>
            </div>
            <Header />
        </div>
    );
};

export default Friends;