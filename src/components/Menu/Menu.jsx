// src/components/Menu/Menu.jsx

import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import { FaHome, FaCog, FaRss, FaCommentDots } from 'react-icons/fa';

const Menu = () => {
  const [currentPage, setCurrentPage] = useState('');

  useEffect(() => {
    const currentUrl = window.location.href;
    if (currentUrl.includes('popup.html')) {
      setCurrentPage('home');
    } else if (currentUrl.includes('options.html')) {
      setCurrentPage('options');
    } else if (currentUrl.includes('rssfeed.html')) {
      setCurrentPage('rssfeed');
    } else if (currentUrl.includes('content_generator.html')) {
      setCurrentPage('contentGenerator');
    } else {
      setCurrentPage('');
    }
  }, []);

  const navigateTo = (page) => {
    const urlMap = {
      home: 'popup.html',
      options: 'options.html',
      rssfeed: 'rssfeed.html',
      contentGenerator: 'content_generator.html',
    };

    const url = chrome.runtime.getURL(urlMap[page]);

    if (page === 'home') {
      window.location.href = url;
    } else {
      window.location.href = url;
    }
  };

  const menuItems = [
    { name: 'Home', icon: <FaHome />, key: 'home' },
    { name: 'Options', icon: <FaCog />, key: 'options' },
    { name: 'RSS Feed Settings', icon: <FaRss />, key: 'rssfeed' },
    { name: 'Content Generator', icon: <FaCommentDots />, key: 'contentGenerator' },
  ];

  return (
    <nav className="bg-gray-800 p-2 rounded mb-4" aria-label="Main Navigation">
      <ul className="flex space-x-2 justify-center">
        {menuItems.map((item) => (
          <li key={item.key}>
            <button
              onClick={() => navigateTo(item.key)}
              className={classNames(
                'flex items-center px-3 py-2 rounded-md text-sm font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition',
                {
                  'bg-gray-700': currentPage === item.key,
                }
              )}
              aria-label={`Navigate to ${item.name}`}
              aria-current={currentPage === item.key ? 'page' : undefined}
            >
              {item.icon}
              <span className="ml-1">{item.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Menu;
