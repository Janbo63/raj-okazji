import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log("Raj Okazji: Initializing Application v3.21");

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("Raj Okazji: Could not find root element");
  throw new Error("Missing root element");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);