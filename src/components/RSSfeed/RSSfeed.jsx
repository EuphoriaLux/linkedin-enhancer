// src/components/RSSfeed/RSSfeed.jsx

import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { FaTrash, FaPlus } from 'react-icons/fa';
import './RSSfeed.css';

const PLACEHOLDER_FEED_IMAGE = 'https://via.placeholder.com/50?text=Feed';

const RSSfeed = () => {
  const [rssFeeds, setRssFeeds] = useState([]);
  const [newFeedUrl, setNewFeedUrl] = useState('');
  const [rssStatus, setRssStatus] = useState({ message: '', type: '' });
  const iframeRef = useRef(null);

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

  // Setup message listener
  useEffect(() => {
    const messageHandler = (event) => {
      // Ensure the message is coming from the fetcher iframe
      if (event.source !== iframeRef.current.contentWindow) {
        return;
      }

      const { action, feed, error } = event.data;

      if (action === 'rssFeedData' && feed) {
        const feedTitle = feed.title || 'No Title';
        const feedImage = feed.image || PLACEHOLDER_FEED_IMAGE;

        // Add new feed object
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
      } else if (action === 'rssFeedError' && error) {
        setRssStatus({ message: `Failed to fetch RSS feed. Error: ${error}`, type: 'error' });
        console.error('Add RSS Feed Error:', error);
      }
    };

    window.addEventListener('message', messageHandler);

    return () => {
      window.removeEventListener('message', messageHandler);
    };
  }, [rssFeeds, newFeedUrl]);

  // Function to add a new RSS feed by fetching its title and image via fetcher iframe
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

    // Send message to fetcher iframe to fetch the RSS feed
    if (iframeRef.current) {
      iframeRef.current.contentWindow.postMessage(
        { action: 'fetchRSSFeed', feedUrl: newFeedUrl },
        window.location.origin // Updated to use window.location.origin
      );
      setRssStatus({ message: 'Fetching RSS feed...', type: 'info' });
    }
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
    <div className="rssfeed-container">
      <h1>RSS Feed Management</h1>
      <div className="add-feed-section">
        <input
          type="text"
          value={newFeedUrl}
          onChange={(e) => setNewFeedUrl(e.target.value)}
          placeholder="Enter RSS feed URL..."
          title="RSS Feed URL"
          required
        />
        <button
          type="button"
          onClick={addRssFeed}
          className="button button-secondary"
          title="Add RSS Feed"
        >
          <FaPlus /> Add
        </button>
      </div>
      {rssStatus.message && (
        <div className={`rss-status ${rssStatus.type}`}>
          {rssStatus.message}
        </div>
      )}
      {rssFeeds.length > 0 && (
        <ul className="rss-feed-list">
          {rssFeeds.map((feed, index) => (
            <li key={index}>
              <div className="feed-info">
                <img
                  src={feed.image}
                  alt={`${feed.title} logo`}
                  className="feed-image"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = PLACEHOLDER_FEED_IMAGE;
                  }}
                />
                <span className="feed-title">{feed.title}</span>
              </div>
              <button
                type="button"
                onClick={() => removeRssFeed(feed.url)}
                title="Remove RSS Feed"
                className="remove-button"
              >
                <FaTrash />
              </button>
            </li>
          ))}
        </ul>
      )}
      {/* Navigation Link Back to Options */}
      <div className="navigation-links">
        <a href="options.html" target="_blank" rel="noopener noreferrer">
          Back to General Settings
        </a>
      </div>
      {/* Hidden Fetcher Iframe */}
      <iframe
        ref={iframeRef}
        src={chrome.runtime.getURL('components/RSSfeed/fetcher.html')}
        style={{ display: 'none' }}
        title="RSS Fetcher"
      ></iframe>
    </div>
  );
};

ReactDOM.render(<RSSfeed />, document.getElementById('root'));
