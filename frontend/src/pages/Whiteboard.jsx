import React from 'react';
import Navbar from '../components/Navbar';
import { Excalidraw } from '@excalidraw/excalidraw';
import "@excalidraw/excalidraw/index.css";

const Whiteboard = () => {
  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />
      <div style={{ flex: 1 }}>
        <Excalidraw />
      </div>
    </div>
  );
};

export default Whiteboard;
