// src/components/Popup/Popup.jsx

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import 'Assets/styles/tailwind.css'; // Ensure Tailwind CSS is imported
import { FaLinkedin, FaComments, FaCog, FaRss, FaClipboard } from 'react-icons/fa'; // Import additional icons as needed
import LoginButton from '../Login/LoginButton'; // Adjust path as needed
import ConnectionsList from '../Login/ConnectionsList'; // Adjust path as needed
import LogoutButton from '../Login/LogoutButton'; // Optional: Implement Logout functionality

const Popup = () => {
  const [activeFeeds, setActiveFeeds] = useState(0);
  const [recentComments, setRecentComments] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Fetch data from chrome.storage or other sources on mount
  useEffect(() => {
    // Example: Fetch RSS feeds and comments from chrome.storage
    chrome.storage.sync.get(['rssFeeds', 'recentComments', 'linkedinAccessToken'], (result) => {
      setActiveFeeds(result.rssFeeds ? result.rssFeeds.length : 0);
      setRecentComments(result.recentComments || []);
      if (result.linkedinAccessToken) {
        setIsLoggedIn(true);
      }
    });
  }, []);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    // Optionally, refresh connections or perform other actions
  };

  const handleLogout = () => {
    chrome.storage.local.remove(['linkedinAccessToken'], () => {
      setIsLoggedIn(false);
      alert('Logged out from LinkedIn.');
    });
  };

  return (
    <div className="flex flex-col bg-white rounded-lg shadow-md w-80 h-auto p-4 overflow-y-auto">
      {/* Header Section */}
      <header className="flex items-center justify-center mb-4">
        <FaLinkedin className="text-blue-600 mr-2" size={24} />
        <h1 className="text-xl font-semibold text-gray-800">LinkedIn Comment Generator</h1>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow">
        {/* Welcome Message */}
        <section className="mb-4">
          <p className="text-center text-gray-600">
            Manage your LinkedIn comments and RSS feeds efficiently.
          </p>
        </section>

        {/* Dashboard Stats */}
        <section className="mb-4">
          <div className="flex justify-around">
            <div className="flex flex-col items-center">
              <FaRss className="text-green-500" size={24} />
              <span className="mt-1 text-gray-700">{activeFeeds}</span>
              <span className="text-sm text-gray-500">Active Feeds</span>
            </div>
            <div className="flex flex-col items-center">
              <FaComments className="text-blue-500" size={24} />
              <span className="mt-1 text-gray-700">{recentComments.length}</span>
              <span className="text-sm text-gray-500">Recent Comments</span>
            </div>
          </div>
        </section>

        {/* Recent Comments */}
        {recentComments.length > 0 && (
          <section className="mb-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Recent Comments</h2>
            <ul className="space-y-2 max-h-40 overflow-y-auto">
              {recentComments.slice(-5).map((comment, index) => (
                <li key={index} className="p-2 bg-gray-100 rounded">
                  {comment}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* LinkedIn Authentication Section */}
        <section className="mb-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">LinkedIn Integration</h2>
          {!isLoggedIn ? (
            <LoginButton onLoginSuccess={handleLoginSuccess} />
          ) : (
            <div className="mt-4">
              <p className="text-green-600 mb-2">Connected to LinkedIn!</p>
              <ConnectionsList />
              <LogoutButton onLogout={handleLogout} />
            </div>
          )}
        </section>

        {/* Quick Actions */}
        <section className="space-y-3">
          <button
            onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL('content_generator.html') })}
            className="flex items-center justify-center w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none transition"
            aria-label="Open Content Generator"
          >
            <FaComments className="mr-2" /> Content Generator
          </button>

          <button
            onClick={() => chrome.runtime.openOptionsPage()}
            className="flex items-center justify-center w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 focus:outline-none transition"
            aria-label="Open Options"
          >
            <FaCog className="mr-2" /> Options
          </button>

          <button
            onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL('rssfeed.html') })}
            className="flex items-center justify-center w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 focus:outline-none transition"
            aria-label="Open RSS Feed Settings"
          >
            <FaRss className="mr-2" /> RSS Feed Settings
          </button>
        </section>
      </main>

      {/* Footer Section */}
      <footer className="mt-4 text-center">
        <button
          onClick={() => {
            // Example action: Copy extension URL or any other info
            navigator.clipboard.writeText(chrome.runtime.getURL('popup.html'))
              .then(() => alert('Extension URL copied to clipboard!'))
              .catch(() => alert('Failed to copy URL.'));
          }}
          className="flex items-center justify-center w-full px-4 py-2 bg-blue-300 text-white rounded hover:bg-blue-400 focus:outline-none transition"
          aria-label="Copy Extension URL"
        >
          <FaClipboard className="mr-2" /> Copy Extension URL
        </button>
      </footer>
    </div>
  );
};

ReactDOM.render(<Popup />, document.getElementById('root'));
