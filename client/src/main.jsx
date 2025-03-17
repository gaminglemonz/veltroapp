import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App';
import './index.css';
import AuthProvider from './context/auth';
import { BrowserRouter } from 'react-router-dom';

Sentry.init({ 
    dsn: "https://8a46fbcbdbac895e9b98ce68b47e597f@o4508791220731904.ingest.us.sentry.io/4508791229317120",
    tracesSampleRate: 1.0,
 })

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);