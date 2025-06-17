// src/components/owner/OwnerLayout.js
import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../owner/Sidebar'; // Import the Sidebar component

const OwnerLayout = () => {
  return (
    <div style={{ display: 'flex' }}>
      {/* Sidebar for Owner */}
      <Sidebar />

      {/* Main content area */}
      <div style={{ flexGrow: 1, padding: '20px' }}>
        <Outlet /> {/* Renders child routes here */}
      </div>
    </div>
  );
};

export default OwnerLayout;
