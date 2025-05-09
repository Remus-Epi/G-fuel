import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import Navbar from './components/Navbar';

const root = ReactDOM.createRoot(document.getElementById('root')); // Create the root element
root.render(
  <React.StrictMode>
    <Navbar />
    {/* Other components */}
  </React.StrictMode>
);

document.getElementById("loginForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const response = await fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const result = await response.json();
  alert(result.message);
});

reportWebVitals();
