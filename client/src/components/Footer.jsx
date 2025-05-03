import React from 'react';

export default function Footer () {
    return (
        <footer className="bg-slate-800 text-gray-400 text-center py-10 mt-10">
            <img src='../images/veltro.png' alt='animal pic' width="70" className='mx-auto mb-6' />
            <p>&copy; 2025 Veltro. All rights reserved.</p>
            <p>Contact us at <a href="mailto:support@veltro.com" className="text-indigo-400 hover:underline">support@veltro.com</a></p>
        </footer>
    );
}