import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './routes/Home';
import Dashboard from './routes/Dashboard';
import Room from './routes/Room';
import Error from './routes/Error';
import Login from './routes/Login';
import Rooms from './routes/Rooms';
import Signup from './routes/Signup';
import Profile from './routes/Profile';
import CreateRoom from './routes/CreateRoom';
import Friends from './routes/Friends';
import './index.css';

const App = () => {
    return (
        <Routes>
            <Route path="*" element={<Error />} />
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path='/signup' element={<Signup />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile/:username" element={<Profile />} />
            <Route path="/friends" element={<Friends />} />
            <Route path="/rooms" element={<Rooms />} />
            <Route path="/create-room" element={<CreateRoom />} />
            <Route path="/rooms/:id" element={<Room />} />
        </Routes>
    );
};

export default App;
