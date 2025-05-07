import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Remove any existing next-route-announcer elements
document.querySelectorAll('next-route-announcer').forEach(el => el.remove());

const container = document.getElementById('root');
if (!container) throw new Error('Failed to find the root element');

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);