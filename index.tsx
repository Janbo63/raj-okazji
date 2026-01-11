import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log("Raj Okazji: Initializing Application v3.5");

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
  // The global onerror in index.html will catch this if it bubbles up,
  // but let's ensure we write to the DOM here too just in case.
  rootElement.innerHTML = `<div style="padding: 20px; text-align: center; font-family: sans-serif; color: red;">
    <h2>Application Error</h2>
    <pre>${error instanceof Error ? error.message : JSON.stringify(error)}</pre>
  </div>`;
}