// src/components/RSSfeed/RSSfeed.jsx

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { FaTrash, FaPlus } from 'react-icons/fa';
import Menu from '../Menu/Menu'; // Import the Menu component
import 'Assets/styles/tailwind.css'; // Ensure Tailwind CSS is imported

const PLACEHOLDER_FEED_IMAGE = 'https://via.placeholder.com/50?text=Feed';

const RSSfeed = () => {
  const [rssFeeds, setRssFeeds] = useState([]);
  const [newFeedUrl, setNewFeedUrl] = useState('');
  const [rssStatus, setRssStatus] = useState({ message: '', type: '' });

  // Load RSS feeds from chrome.storage on component mount
  useEffect(() => {
    chrome.storage.sync.get(['rssFeeds'], (result) => {
      if (result.rssFeeds) {
        setRssFeeds(result.rssFeeds);
        console.log('RSS Feeds Loaded:', result.rssFeeds);
      } else {
        setRssFeeds([]);
        console.log('No RSS Feeds Found.');
      }
    });
  }, []);

  // Function to add a new RSS feed by sending a message to the background script
  const addRssFeed = () => {
    if (newFeedUrl.trim() === '') {
      setRssStatus({ message: 'Please enter the RSS feed URL.', type: 'error' });
      console.error('Add RSS Feed Error: Missing URL.');
      return;
    }

    // Simple URL validation
    try {
      new URL(newFeedUrl);
    } catch (e) {
      setRssStatus({ message: 'Please enter a valid URL.', type: 'error' });
      console.error('Add RSS Feed Error: Invalid URL.');
      return;
    }

    // Check if the feed already exists
    const feedExists = rssFeeds.some((feed) => feed.url === newFeedUrl);
    if (feedExists) {
      setRssStatus({ message: 'This RSS feed is already added.', type: 'error' });
      console.error('Add RSS Feed Error: Feed already exists.');
      return;
    }

    // Send message to background script to fetch the RSS feed
    chrome.runtime.sendMessage(
      { action: 'fetchRSSFeed', feedUrl: newFeedUrl },
      (response) => {
        if (response.error) {
          setRssStatus({ message: `Failed to fetch RSS feed. Error: ${response.error}`, type: 'error' });
          console.error('Add RSS Feed Error:', response.error);
          return;
        }

        const feed = response.feed;
        const feedTitle = feed.title || 'No Title';
        const feedImage = feed.image || PLACEHOLDER_FEED_IMAGE;

        const newFeed = {
          url: newFeedUrl,
          title: feedTitle,
          image: feedImage,
        };

        const updatedFeeds = [...rssFeeds, newFeed];
        setRssFeeds(updatedFeeds);
        setNewFeedUrl('');
        setRssStatus({ message: 'RSS feed added successfully!', type: 'success' });
        console.log('RSS Feed Added:', newFeed);

        // Save updated feeds to chrome.storage
        chrome.storage.sync.set({ rssFeeds: updatedFeeds }, () => {
          console.log('RSS Feeds Saved to chrome.storage');
        });
      }
    );

    // Set status to fetching
    setRssStatus({ message: 'Fetching RSS feed...', type: 'info' });
  };

  // Function to remove an RSS feed
  const removeRssFeed = (url) => {
    if (window.confirm('Are you sure you want to remove this RSS feed?')) {
      const updatedFeeds = rssFeeds.filter((feed) => feed.url !== url);
      setRssFeeds(updatedFeeds);
      setRssStatus({ message: 'RSS feed removed successfully!', type: 'success' });
      console.log('RSS Feed Removed:', url);

      // Save updated feeds to chrome.storage
      chrome.storage.sync.set({ rssFeeds: updatedFeeds }, () => {
        console.log('RSS Feeds Updated in chrome.storage');
      });
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-2xl mx-auto mt-10">
      {/* Navigation Menu */}
      <Menu /> {/* Include the Menu component */}
      <h1 className="text-2xl font-semibold mb-6">RSS Feed Management</h1>
      
      <div className="flex items-center mb-4">
        <input
          type="text"
          value={newFeedUrl}
          onChange={(e) => setNewFeedUrl(e.target.value)}
          placeholder="Enter RSS feed URL..."
          title="RSS Feed URL"
          required
          className="flex-grow px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={addRssFeed}
          className="flex items-center px-4 py-2 bg-green-500 text-white rounded-r-md hover:bg-green-600 focus:outline-none transition"
          title="Add RSS Feed"
        >
          <FaPlus className="mr-2" /> Add
        </button>
      </div>

      {rssStatus.message && (
        <div
          className={`mb-4 p-3 rounded ${
            rssStatus.type === 'error'
              ? 'bg-red-100 text-red-700'
              : rssStatus.type === 'success'
              ? 'bg-green-100 text-green-700'
              : 'bg-blue-100 text-blue-700'
          }`}
        >
          {rssStatus.message}
        </div>
      )}

      {rssFeeds.length > 0 && (
        <ul className="space-y-4">
          {rssFeeds.map((feed, index) => (
            <li key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-md">
              <div className="flex items-center">
                <img
                  src={feed.image}
                  alt={`${feed.title} logo`}
                  className="w-12 h-12 mr-4 rounded"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = PLACEHOLDER_FEED_IMAGE;
                  }}
                />
                <span className="text-lg">{feed.title}</span>
              </div>
              <button
                type="button"
                onClick={() => removeRssFeed(feed.url)}
                title="Remove RSS Feed"
                className="text-red-500 hover:text-red-700 focus:outline-none"
              >
                <FaTrash />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Navigation Link Back to Options */}
      <div className="mt-6 text-center">
        <a
          href="options.html"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline"
        >
          Back to General Settings
        </a>
      </div>
    </div>
  );
};

ReactDOM.render(<RSSfeed />, document.getElementById('root'));