
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log("Raj Okazji: Initializing Application...");

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("Raj Okazji: Could not find root element to mount to");
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log("Raj Okazji: Render successful");
} catch (error) {
  console.error("Raj Okazji: Critical Render Error", error);
  rootElement.innerHTML = `<div style="padding: 20px; text-align: center; font-family: sans-serif;">
    <h2>Application Error</h2>
    <p>Please check the console for details.</p>
  </div>`;
}
