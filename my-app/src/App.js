import logo from './logo.svg';
import './App.css';
import React from 'react';
import Navbar from './components/Navbar'; // Adjust path as needed
import Content from './components/Content'; 

function App() {
  return (
    <div>
      <Navbar />
      <Content />
    </div>
  );
}

export default App;

