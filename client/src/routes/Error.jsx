import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as Sentry from '@sentry/react';

const errorMessages = {
    400: "Bad Request - Something's not quite right",
    401: "Unauthorized - Please log in first",
    403: "Forbidden - You don't have permission to access this",
    404: "Page Not Found - Lost in space",
    500: "Server Error - Something went wrong on our end",
};

const Error = () => {
    let navigate, location;
    
    try {
        const navigate = useNavigate();
        const location = useLocation();
    } catch (err) {
        Sentry.captureException(err);
    }

    const errorCode = location.state?.errorCode || 404;
    const errorMessage = errorMessages[errorCode] || "An unknown error occurred";
    const errorDetails = location.state?.message || "That's all we know";
    const errorPage = 
    <div className="dark:bg-slate-900 dark:text-white min-h-screen flex items-center justify-center p-4">
        <div className="max-w-2xl w-full text-center space-y-8">
        <h1 className="text-8xl md:text-9xl font-bold text-transparent bg-clip-text 
                    bg-gradient-to-r from-indigo-600 to-purple-600 animate-bounce">
            {errorCode}
        </h1>

        <p className="text-xl">{errorMessage}</p>

        {errorDetails && (
            <div className="bg-slate-800 p-4 rounded-lg text-left font-mono text-sm overflow-auto">
            <p className="text-red-400">{errorDetails}</p>
            </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <a href="/" className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                Back to Home
            </a>
            <button onClick={() => navigate(-1)} className="px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors">
                Go Back
            </button>
        </div>

        <p className="text-gray-400 mt-8">
            Need help?{' '}<a href="/support" className="text-indigo-400 hover:underline">Contact Support</a>
        </p>
        </div>
    </div>
    return errorPage;
}

export default Error;