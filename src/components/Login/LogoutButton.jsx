// src/components/Login/LogoutButton.jsx

import React from 'react';
import { FaSignOutAlt } from 'react-icons/fa';

const LogoutButton = ({ onLogout }) => {
  const handleLogout = () => {
    chrome.storage.local.remove(['linkedinAccessToken'], () => {
      console.log('LinkedIn access token removed.');
      if (onLogout) {
        onLogout();
      }
      alert('Logged out from LinkedIn.');
    });
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center justify-center px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition duration-200 mt-4"
      aria-label="Logout from LinkedIn"
    >
      <FaSignOutAlt className="mr-2" /> Logout
    </button>
  );
};

export default LogoutButton;
