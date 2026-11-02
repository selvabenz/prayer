import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/600.css';
import '@fontsource/libre-caslon-display/400.css';
import '@fontsource/noto-sans-tamil/400.css';
import App from './App';
import { watchAppUpdates } from './app-update';
import './style.css';
import './features.css';
import './places.css';
import './responsive.css';

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void watchAppUpdates().catch(error => console.error('Offline installation failed:', error));
  });
}
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
