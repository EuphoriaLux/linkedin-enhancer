// src/components/ContentGenerator/content_generator.jsx

import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { FaCopy, FaLinkedin } from 'react-icons/fa';
import './ContentGenerator.css';

const PLACEHOLDER_ARTICLE_IMAGE = 'https://via.placeholder.com/150?text=No+Image';

const ContentGenerator = () => {
  const [rssFeeds, setRssFeeds] = useState([]);
  const [selectedFeed, setSelectedFeed] = useState(null);
  const [articles, setArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [generatedContent, setGeneratedContent] = useState('');
  const [status, setStatus] = useState({ message: '', type: '' });
  const iframeRef = useRef(null);

  // Load RSS feeds from chrome.storage on component mount
  useEffect(() => {
    chrome.storage.sync.get(['rssFeeds'], (result) => {
      if (result.rssFeeds && result.rssFeeds.length > 0) {
        setRssFeeds(result.rssFeeds);
        setSelectedFeed(result.rssFeeds[0]); // Select the first feed by default
      } else {
        setRssFeeds([]);
        console.log('No RSS Feeds Found.');
      }
    });
  }, []);

  // Load articles when a feed is selected
  useEffect(() => {
    if (selectedFeed) {
      fetchRSSFeedArticles(selectedFeed.url);
    }
  }, [selectedFeed]);

  // Function to fetch and parse RSS feed articles via iframe
  const fetchRSSFeedArticles = (feedUrl) => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow.postMessage(
        { action: 'fetchRSSFeed', feedUrl },
        window.location.origin
      );
      setStatus({ message: 'Fetching RSS feed articles...', type: 'info' });
    }
  };

  // Setup message listener for fetcher iframe
  useEffect(() => {
    const messageHandler = (event) => {
      // Ensure the message is coming from the fetcher iframe
      if (event.source !== iframeRef.current.contentWindow) {
        return;
      }

      const { action, feed, error } = event.data;

      if (action === 'rssFeedData' && feed) {
        setArticles(feed.items);
        setSelectedArticle(feed.items[0]);
        setStatus({ message: 'RSS feed articles loaded.', type: 'success' });
        console.log('RSS Feed Articles Loaded:', feed.items);
      } else if (action === 'rssFeedError' && error) {
        setStatus({ message: `Failed to fetch RSS feed. Error: ${error}`, type: 'error' });
        console.error('Fetch RSS Feed Error:', error);
      }
    };

    window.addEventListener('message', messageHandler);

    return () => {
      window.removeEventListener('message', messageHandler);
    };
  }, []);

  // Function to generate comment using AI
  const generateComment = () => {
    if (!selectedArticle) {
      setStatus({ message: 'Please select an article.', type: 'error' });
      return;
    }

    const posterName = 'LinkedInUser'; // You can make this dynamic if needed
    const articleContent = selectedArticle.description || selectedArticle.title || '';

    chrome.runtime.sendMessage(
      {
        action: 'generateComment',
        posterName: posterName,
        articleContent: articleContent,
      },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error('Generate Comment Error:', chrome.runtime.lastError.message);
          setStatus({ message: 'Failed to generate comment.', type: 'error' });
          return;
        }

        if (response && response.comment) {
          setGeneratedContent(response.comment);
          setStatus({ message: 'Comment generated successfully!', type: 'success' });
        } else if (response && response.error) {
          setStatus({ message: response.error, type: 'error' });
          console.error('Generate Comment Error:', response.error);
        }
      }
    );
  };

  // Function to copy the prepared LinkedIn post to clipboard
  const copyToClipboard = () => {
    const postContent = `💬 ${generatedContent}\n\n📖 ${selectedArticle.link}\n\n#LinkedIn #AI #Automation`;
    navigator.clipboard.writeText(postContent)
      .then(() => {
        setStatus({ message: 'Post copied to clipboard!', type: 'success' });
      })
      .catch((err) => {
        setStatus({ message: 'Failed to copy post.', type: 'error' });
        console.error('Copy Error:', err);
      });
  };

  // Function to open LinkedIn post creation with pre-filled content
  const openLinkedInPost = () => {
    const postContent = `💬 ${generatedContent}\n\n📖 ${selectedArticle.link}\n\n#LinkedIn #AI #Automation`;
    const linkedinUrl = `https://www.linkedin.com/feed/`;

    // Note: LinkedIn does not support pre-filling post content via URL parameters due to security reasons.
    // Therefore, users need to manually paste the content. We can guide them accordingly.
    window.open(linkedinUrl, '_blank');
    setStatus({ message: 'Please paste the copied content into your LinkedIn post.', type: 'info' });
  };

  return (
    <div className="content-generator-container">
      <h1>Content Generator</h1>
      
      {/* RSS Feed Selection */}
      <div className="section">
        <h3>Select RSS Feed</h3>
        {rssFeeds.length > 0 ? (
          <select
            value={selectedFeed ? selectedFeed.url : ''}
            onChange={(e) => {
              const feed = rssFeeds.find(feed => feed.url === e.target.value);
              setSelectedFeed(feed);
            }}
            title="Select an RSS feed"
          >
            {rssFeeds.map((feed, index) => (
              <option key={index} value={feed.url}>
                {feed.title}
              </option>
            ))}
          </select>
        ) : (
          <p>No RSS feeds available. Please add some in the Options page.</p>
        )}
      </div>

      {/* Article Selection */}
      {articles.length > 0 && (
        <div className="section">
          <h3>Select Article</h3>
          <select
            value={selectedArticle ? selectedArticle.link : ''}
            onChange={(e) => {
              const article = articles.find(article => article.link === e.target.value);
              setSelectedArticle(article);
              setGeneratedContent(''); // Clear previous generated content
            }}
            title="Select an article to generate content"
          >
            {articles.map((article, index) => (
              <option key={index} value={article.link}>
                {article.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Display Selected Article */}
      {selectedArticle && (
        <div className="section">
          <h3>Selected Article</h3>
          <div className="article-info">
            <img
              src={selectedArticle.thumbnail || PLACEHOLDER_ARTICLE_IMAGE}
              alt={`${selectedArticle.title} image`}
              className="article-image"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = PLACEHOLDER_ARTICLE_IMAGE;
              }}
            />
            <div className="article-details">
              <h4>{selectedArticle.title}</h4>
              <p>{selectedArticle.description}</p>
              <a href={selectedArticle.link} target="_blank" rel="noopener noreferrer">Read More</a>
            </div>
          </div>
          <button onClick={generateComment} className="button button-primary">
            Generate Comment
          </button>
        </div>
      )}

      {/* Display Generated Content */}
      {generatedContent && (
        <div className="section">
          <h3>Generated Content</h3>
          <textarea
            rows="4"
            value={generatedContent}
            readOnly
          ></textarea>
          <div className="button-group">
            <button onClick={copyToClipboard} className="button button-secondary">
              <FaCopy /> Copy Post
            </button>
            <button onClick={openLinkedInPost} className="button button-secondary">
              <FaLinkedin /> Open LinkedIn
            </button>
          </div>
        </div>
      )}

      {/* Status Message */}
      {status.message && (
        <div className={`status ${status.type}`}>
          {status.message}
        </div>
      )}

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

ReactDOM.render(<ContentGenerator />, document.getElementById('root'));
