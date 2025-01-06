// src/components/ContentGenerator/ContentGenerator.jsx

import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { FaCopy, FaLinkedin } from 'react-icons/fa';
import './ContentGenerator.css';
import { extractArticleContent } from '../../Utils/contentExtractor.js';

const PLACEHOLDER_FEED_IMAGE = 'https://via.placeholder.com/150?text=No+Image';
const PLACEHOLDER_ARTICLE_IMAGE = 'https://via.placeholder.com/150?text=No+Image';

const ContentGenerator = () => {
  const [rssFeeds, setRssFeeds] = useState([]);
  const [selectedFeed, setSelectedFeed] = useState(null);
  const [articles, setArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [generatedContent, setGeneratedContent] = useState('');
  const [status, setStatus] = useState({ message: '', type: '' });
  const iframeRef = useRef(null);

  // Fetch RSS Feeds on mount
  useEffect(() => {
    chrome.storage.sync.get(['rssFeeds'], (result) => {
      if (result.rssFeeds && result.rssFeeds.length > 0) {
        setRssFeeds(result.rssFeeds);
        setSelectedFeed(result.rssFeeds[0]);
        console.log('📥 Loaded RSS Feeds:', result.rssFeeds);
      } else {
        setRssFeeds([]);
        setStatus({
          message: 'No RSS feeds available. Please add some in the Options page.',
          type: 'error',
        });
      }
    });
  }, []);

  // Fetch Articles when a feed is selected
  useEffect(() => {
    if (selectedFeed) {
      setArticles([]);
      setSelectedArticle(null);
      setGeneratedContent('');
      setStatus({ message: `Fetching articles from ${selectedFeed.title}...`, type: 'info' });
      fetchRSSFeedArticles(selectedFeed.url);
    }
  }, [selectedFeed]);

  const fetchRSSFeedArticles = (feedUrl) => {
    if (iframeRef.current) {
      console.log('🔄 Fetching RSS Feed:', feedUrl);
      iframeRef.current.contentWindow.postMessage(
        { action: 'fetchRSSFeed', feedUrl },
        window.location.origin
      );
    } else {
      console.error('❌ Iframe reference is not set.');
    }
  };

  // Listen for messages from the iframe
  useEffect(() => {
    const messageHandler = (event) => {
      if (!iframeRef.current || event.source !== iframeRef.current.contentWindow) return;

      const { action, feed, error } = event.data;

      if (action === 'rssFeedData' && feed) {
        console.log('📥 RSS Feed Data Received:', feed);
        if (feed.items && feed.items.length > 0) {
          setArticles(feed.items);
          setSelectedArticle(feed.items[0]);
          setStatus({ message: 'RSS feed articles loaded successfully.', type: 'success' });
        } else {
          setStatus({ message: 'No articles found in this feed.', type: 'warning' });
          setArticles([]);
        }
      } else if (action === 'rssFeedError') {
        console.error('❌ RSS Feed Error:', error);
        setStatus({ message: `Failed to fetch RSS feed. Error: ${error}`, type: 'error' });
      }
    };

    window.addEventListener('message', messageHandler);
    return () => window.removeEventListener('message', messageHandler);
  }, []);

  // Fetch website content
  const fetchWebsiteContent = async (url) => {
    setStatus({ message: 'Fetching website content...', type: 'info' });
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch website content: ${response.statusText}`);
      }

      const htmlString = await response.text();

      // Extract content
      const cleanContent = extractArticleContent(htmlString);
      return cleanContent.substring(0, 2000);
    } catch (error) {
      console.error('❌ Error fetching website content:', error);
      return 'Content extraction failed.';
    }
  };

  // Generate Post
  const generatePost = async () => {
    if (!selectedArticle) {
      setStatus({ message: 'Please select an article first.', type: 'error' });
      return;
    }

    const posterName = 'LinkedInUser';
    const articleContent = selectedArticle.description || selectedArticle.title || '';

    setStatus({ message: 'Generating post...', type: 'info' });

    const extractedWebsiteContent = await fetchWebsiteContent(selectedArticle.link);

    chrome.runtime.sendMessage(
      {
        action: 'generatePost',
        posterName,
        articleContent,
        websiteContent: extractedWebsiteContent,
        websiteURL: selectedArticle.link,
      },
      (response) => {
        if (chrome.runtime.lastError) {
          setStatus({ message: 'Failed to generate post.', type: 'error' });
          console.error('❌ Generate Post Error:', chrome.runtime.lastError.message);
          return;
        }

        if (response && response.post) {
          setGeneratedContent(response.post);
          setStatus({ message: 'Post generated successfully!', type: 'success' });
        } else if (response && response.error) {
          setStatus({ message: response.error, type: 'error' });
          console.error('❌ Generate Post Error:', response.error);
        }
      }
    );
  };

  // Copy to Clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setStatus({ message: 'Copied to clipboard!', type: 'success' });
      })
      .catch((err) => {
        console.error('❌ Failed to copy text:', err);
        setStatus({ message: 'Failed to copy text.', type: 'error' });
      });
  };

  // Open LinkedIn
  const openLinkedIn = () => {
    window.open('https://www.linkedin.com/', '_blank');
  };

  return (
    <div className="content-generator">
      <div className="content-generator__header">
        <h1>Content Generator</h1>
      </div>

      {status.message && (
        <div
          className={`content-generator__status content-generator__status--${status.type}`}
          aria-live="polite"
        >
          {/* Optional: Add icons based on status type */}
          {/* Example: <FaCheckCircle /> for success */}
          {status.message}
        </div>
      )}

      <div className="content-generator__main">
        {/* RSS Feed Selection */}
        <div className="content-generator__section">
          <h3>Select RSS Feed</h3>
          {rssFeeds.length > 0 ? (
            <div className="content-generator__list">
              {rssFeeds.map((feed, index) => (
                <div
                  key={index}
                  className={`content-generator__item ${
                    selectedFeed?.url === feed.url ? 'content-generator__item--selected' : ''
                  }`}
                  onClick={() => setSelectedFeed(feed)}
                  role="button"
                  tabIndex={0}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setSelectedFeed(feed);
                    }
                  }}
                >
                  <img
                    src={feed.image || PLACEHOLDER_FEED_IMAGE}
                    alt={feed.title}
                    className="content-generator__image"
                    loading="lazy"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = PLACEHOLDER_FEED_IMAGE;
                    }}
                  />
                  <div className="content-generator__title">{feed.title}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="content-generator__no-selection">
              No RSS feeds available. Please add some in the Options page.
            </p>
          )}
        </div>

        {/* Article Selection */}
        <div className="content-generator__section">
          <h3>Select Article</h3>
          {articles.length > 0 ? (
            <div className="content-generator__list">
              {articles.map((article, index) => (
                <div
                  key={index}
                  className={`content-generator__item ${
                    selectedArticle?.link === article.link
                      ? 'content-generator__item--selected'
                      : ''
                  }`}
                  onClick={() => {
                    setSelectedArticle(article);
                    setGeneratedContent('');
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setSelectedArticle(article);
                      setGeneratedContent('');
                    }
                  }}
                >
                  <img
                    src={article.image || PLACEHOLDER_ARTICLE_IMAGE}
                    alt={article.title}
                    className="content-generator__image"
                    loading="lazy"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = PLACEHOLDER_ARTICLE_IMAGE;
                    }}
                  />
                  <div className="content-generator__title">{article.title}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="content-generator__no-selection">No articles available for this feed.</p>
          )}
        </div>

        {/* Article Preview */}
        {selectedArticle && (
          <div className="content-generator__section">
            <h3>Article Preview</h3>
            <div className="content-generator__preview">
              <h4>{selectedArticle.title}</h4>
              <p>{selectedArticle.description || 'No description available.'}</p>
              <a href={selectedArticle.link} target="_blank" rel="noopener noreferrer">
                Read more
              </a>
            </div>
          </div>
        )}

        {/* Generated Post */}
        <div className="content-generator__section content-generator__post-section">
          <h3>Generated Post</h3>
          {generatedContent ? (
            <div className="content-generator__generated-post">
              <div className="content-generator__content">{generatedContent}</div>
              <div className="content-generator__actions">
                <button
                  onClick={() => copyToClipboard(generatedContent)}
                  className="content-generator__button content-generator__button--secondary"
                >
                  <FaCopy /> Copy to Clipboard
                </button>
                <button
                  onClick={openLinkedIn}
                  className="content-generator__button content-generator__button--primary"
                >
                  <FaLinkedin /> Open LinkedIn
                </button>
              </div>
            </div>
          ) : (
            <div>
              {selectedArticle ? (
                <button
                  onClick={generatePost}
                  className="content-generator__button content-generator__button--primary content-generator__generate-button"
                >
                  Generate Post
                </button>
              ) : (
                <p className="content-generator__no-selection">
                  Please select an article to generate a post.
                </p>
              )}
            </div>
          )}
        </div>
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

ReactDOM.render(<ContentGenerator />, document.getElementById('root'));
