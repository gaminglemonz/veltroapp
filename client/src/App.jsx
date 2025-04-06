import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './routes/Home';
import Dashboard from './routes/Dashboard';
import Room from './routes/Room';
import Error from './routes/Error';
import Login from './routes/Login';
import AuthProvider from './context/auth';

const App = () => {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="*" element={<Error />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/room/:id" element={<Room />} />
            <Route path="/login" element={<Login />} />
        </Routes>
    );
};

export default App;
