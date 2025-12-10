import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import AppPage from './ui/app';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <AppPage />
  </React.StrictMode>
);
