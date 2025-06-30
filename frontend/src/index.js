import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// GLOBAL CLEANUP: Clear any corrupt localStorage data immediately on app start
console.log('🧹 GLOBAL CLEANUP: Checking for corrupt localStorage data...');
try {
  // Clear corrupt checkoutState
  const checkoutState = localStorage.getItem('checkoutState');
  if (checkoutState) {
    try {
      const parsed = JSON.parse(checkoutState);
      if (parsed?.eventId === "null" || parsed?.eventId === "undefined" || parsed?.eventId === null) {
        console.warn('🧹 REMOVED: Corrupt checkoutState with invalid eventId:', parsed.eventId);
        localStorage.removeItem('checkoutState');
      }
    } catch (e) {
      console.warn('🧹 REMOVED: Corrupt checkoutState (invalid JSON)');
      localStorage.removeItem('checkoutState');
    }
  }

  // Clear old wallet-related data
  const walletItems = ['walletData', 'walletTransactions', 'walletBalance'];
  walletItems.forEach(item => {
    if (localStorage.getItem(item)) {
      console.warn('🧹 REMOVED: Old wallet data:', item);
      localStorage.removeItem(item);
    }
  });

  // Check total localStorage usage and clear if needed
  let totalUsage = 0;
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    try {
      const value = localStorage.getItem(key);
      if (value) {
        totalUsage += value.length;
        if (value.includes('"null"') || value.includes('"undefined"')) {
          console.warn('🧹 CHECKING: Potentially corrupt localStorage key:', key, value.substring(0, 100));
        }
      }
    } catch (e) {
      console.warn('🧹 REMOVED: Corrupt localStorage key:', key);
      localStorage.removeItem(key);
    }
  });
  
  // If localStorage is too large, clear non-essential data
  const maxQuota = 5 * 1024 * 1024; // 5MB approximation
  if (totalUsage > maxQuota * 0.8) {
    console.warn('🧹 QUOTA WARNING: localStorage usage high, clearing non-essential data');
    const essentialKeys = ['token', 'checkoutState'];
    keys.forEach(key => {
      if (!essentialKeys.includes(key)) {
        try {
          localStorage.removeItem(key);
          console.warn('🧹 REMOVED: Non-essential data:', key);
        } catch (e) {
          console.warn('🧹 Failed to remove key:', key, e);
        }
      }
    });
  }
  
  console.log('✅ CLEANUP COMPLETE: localStorage validated');
} catch (e) {
  console.error('❌ CLEANUP ERROR:', e);
  // Emergency cleanup - try to preserve only the token
  try {
    const token = localStorage.getItem('token');
    localStorage.clear();
    if (token && token !== 'null' && token !== 'undefined') {
      localStorage.setItem('token', token);
    }
    console.log('✅ EMERGENCY CLEANUP: localStorage cleared, token preserved');
  } catch (clearError) {
    console.error('🧹 EMERGENCY CLEANUP FAILED:', clearError);
  }
}

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals(); 