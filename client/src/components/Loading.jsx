import React from 'react';
export default function Loading() {
    return (
        <div className="bg-slate-900 h-screen flex items-center justify-center">
            <div className="text-2xl text-white font-bold relative">Loading...</div>
            <div className="text-lg text-white font-bold absolute motion-safe:animate-ping">Loading...</div>
        </div>
    );
}