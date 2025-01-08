// src/components/ContentGenerator/ContentGenerator.jsx

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { FaCopy, FaLinkedin, FaSpinner, FaSearch, FaCheckCircle, FaExclamationCircle, FaComments } from 'react-icons/fa';
import classNames from 'classnames'; // Ensure classnames is installed
import Menu from '../Menu/Menu'; // Import the Menu component
import { extractArticleContent } from '../../Utils/contentExtractor.js';
import 'Assets/styles/tailwind.css'; // Ensure Tailwind CSS is imported

const PLACEHOLDER_FEED_IMAGE = 'https://via.placeholder.com/150?text=No+Image';
const PLACEHOLDER_ARTICLE_IMAGE = 'https://via.placeholder.com/150?text=No+Image';

const ContentGenerator = () => {
  const [rssFeeds, setRssFeeds] = useState([]);
  const [selectedFeed, setSelectedFeed] = useState(null);
  const [articles, setArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [generatedContent, setGeneratedContent] = useState('');
  const [status, setStatus] = useState({ message: '', type: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [feedSearchTerm, setFeedSearchTerm] = useState('');
  const [articleSearchTerm, setArticleSearchTerm] = useState('');

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
    setIsLoading(true);
    chrome.runtime.sendMessage(
      { action: 'fetchRSSFeed', feedUrl },
      (response) => {
        if (response.error) {
          console.error('❌ RSS Feed Error:', response.error);
          setStatus({ message: `Failed to fetch RSS feed. Error: ${response.error}`, type: 'error' });
          setIsLoading(false);
          return;
        }

        const feed = response.feed;
        console.log('📥 RSS Feed Data Received:', feed);
        if (feed.items && feed.items.length > 0) {
          setArticles(feed.items);
          setSelectedArticle(feed.items[0]);
          setStatus({ message: 'RSS feed articles loaded successfully.', type: 'success' });
        } else {
          setStatus({ message: 'No articles found in this feed.', type: 'warning' });
          setArticles([]);
        }
        setIsLoading(false);
      }
    );
  };

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
      setStatus({ message: 'Content extraction failed.', type: 'error' });
      return 'Content extraction failed.';
    }
  };

  // Generate Post
  const generatePost = async () => {
    if (!selectedArticle) {
      setStatus({ message: 'Please select an article first.', type: 'error' });
      return;
    }

    const feedName = selectedFeed.title; // Use the RSS feed's name
    const articleContent = selectedArticle.description || selectedArticle.title || '';

    setStatus({ message: 'Generating post...', type: 'info' });
    setIsLoading(true);

    const extractedWebsiteContent = await fetchWebsiteContent(selectedArticle.link);

    chrome.runtime.sendMessage(
      {
        action: 'generatePost',
        feedName, // Pass feedName instead of posterName
        articleContent,
        websiteContent: extractedWebsiteContent,
        websiteURL: selectedArticle.link,
      },
      (response) => {
        setIsLoading(false);
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

  // Filtered Feeds based on search term
  const filteredFeeds = rssFeeds.filter(feed =>
    feed.title.toLowerCase().includes(feedSearchTerm.toLowerCase()) ||
    (feed.description && feed.description.toLowerCase().includes(feedSearchTerm.toLowerCase()))
  );

  // Filtered Articles based on search term
  const filteredArticles = articles.filter(article =>
    article.title.toLowerCase().includes(articleSearchTerm.toLowerCase()) ||
    (article.description && article.description.toLowerCase().includes(articleSearchTerm.toLowerCase()))
  );

  return (
    <div className="p-6 font-sans bg-gray-100 min-h-screen rounded-lg shadow-lg">
      {/* Navigation Menu */}
      <Menu /> {/* Include the Menu component */}

      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-blue-600 flex items-center justify-center">
          <FaLinkedin className="mr-2" /> Content Generator
        </h1>
        <p className="text-gray-600 mt-2">Generate engaging LinkedIn posts effortlessly</p>
      </div>

      {/* Status Message */}
      {status.message && (
        <div
          className={classNames(
            'mb-6 p-4 rounded flex items-center',
            {
              'bg-green-100 text-green-800': status.type === 'success',
              'bg-red-100 text-red-800': status.type === 'error',
              'bg-blue-100 text-blue-800': status.type === 'info',
              'bg-yellow-100 text-yellow-800': status.type === 'warning',
            }
          )}
          aria-live="polite"
        >
          {/* Dynamic Icon Based on Status Type */}
          {status.type === 'success' && <FaCheckCircle className="mr-2 text-green-500" />}
          {status.type === 'error' && <FaExclamationCircle className="mr-2 text-red-500" />}
          {status.type === 'warning' && <FaExclamationCircle className="mr-2 text-yellow-500" />}
          {status.type === 'info' && <FaSpinner className="mr-2 animate-spin text-blue-500" />}
          <span>{status.message}</span>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-wrap gap-8">
        {/* Column 1: RSS Feed Selection */}
        <div className="flex-1 min-w-[280px]">
          <h3 className="text-xl font-semibold text-blue-600 mb-4">Select RSS Feed</h3>
          {/* Search Bar for Feeds */}
          <div className="relative mb-4">
            <FaSearch className="absolute top-3 left-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search feeds..."
              value={feedSearchTerm}
              onChange={(e) => setFeedSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
              aria-label="Search RSS Feeds"
            />
          </div>
          {isLoading && selectedFeed ? (
            <div className="flex justify-center items-center">
              <FaSpinner className="animate-spin text-blue-600 text-3xl" />
            </div>
          ) : rssFeeds.length > 0 ? (
            <div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto pr-2">
              {filteredFeeds.length > 0 ? (
                filteredFeeds.map((feed, index) => (
                  <div
                    key={index}
                    className={classNames(
                      'flex items-center p-4 bg-white rounded-md cursor-pointer transition duration-200 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-600',
                      {
                        'border-2 border-blue-600 bg-blue-50': selectedFeed?.url === feed.url,
                      }
                    )}
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
                      className="w-10 h-10 object-cover rounded-md mr-3 flex-shrink-0"
                      loading="lazy"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = PLACEHOLDER_FEED_IMAGE;
                      }}
                    />
                    <div className="flex-1 text-sm font-medium truncate">{feed.title}</div>
                  </div>
                ))
              ) : (
                <p className="text-gray-600">No feeds match your search.</p>
              )}
            </div>
          ) : (
            <p className="text-gray-600">No RSS feeds available. Please add some in the Options page.</p>
          )}
        </div>

        {/* Column 2: Article Selection */}
        <div className="flex-1 min-w-[280px]">
          <h3 className="text-xl font-semibold text-blue-600 mb-4">Select Article</h3>
          {/* Search Bar for Articles */}
          <div className="relative mb-4">
            <FaSearch className="absolute top-3 left-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search articles..."
              value={articleSearchTerm}
              onChange={(e) => setArticleSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
              aria-label="Search Articles"
            />
          </div>
          {isLoading && selectedFeed ? (
            <div className="flex justify-center items-center">
              <FaSpinner className="animate-spin text-blue-600 text-3xl" />
            </div>
          ) : articles.length > 0 ? (
            <div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto pr-2">
              {filteredArticles.length > 0 ? (
                filteredArticles.map((article, index) => (
                  <div
                    key={index}
                    className={classNames(
                      'flex items-center p-4 bg-white rounded-md cursor-pointer transition duration-200 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-600',
                      {
                        'border-2 border-blue-600 bg-blue-50': selectedArticle?.link === article.link,
                      }
                    )}
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
                      className="w-10 h-10 object-cover rounded-md mr-3 flex-shrink-0"
                      loading="lazy"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = PLACEHOLDER_ARTICLE_IMAGE;
                      }}
                    />
                    <div className="flex-1 text-sm font-medium truncate">{article.title}</div>
                  </div>
                ))
              ) : (
                <p className="text-gray-600">No articles match your search.</p>
              )}
            </div>
          ) : (
            <p className="text-gray-600">No articles available for this feed.</p>
          )}
        </div>

        {/* Column 3: Generated Content */}
        <div className="flex-1 min-w-[280px]">
          <h3 className="text-xl font-semibold text-blue-600 mb-4">Generated Post</h3>
          {isLoading && selectedArticle ? (
            <div className="flex justify-center items-center h-40">
              <FaSpinner className="animate-spin text-blue-600 text-4xl" />
            </div>
          ) : generatedContent ? (
            <div className="p-4 border border-green-300 rounded-md bg-green-50">
              <p className="text-gray-800 mb-4 whitespace-pre-wrap">{generatedContent}</p>
              <div className="flex space-x-3">
                <button
                  onClick={() => copyToClipboard(generatedContent)}
                  className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                  aria-label="Copy to Clipboard"
                >
                  <FaCopy className="mr-2" /> Copy to Clipboard
                </button>
                <button
                  onClick={openLinkedIn}
                  className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Open LinkedIn"
                >
                  <FaLinkedin className="mr-2" /> Open LinkedIn
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-start">
              {selectedArticle ? (
                <button
                  onClick={generatePost}
                  className={classNames(
                    'w-full flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md shadow-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500',
                    {
                      'opacity-50 cursor-not-allowed': isLoading,
                    }
                  )}
                  aria-label="Generate Post"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <FaSpinner className="mr-2 animate-spin" /> Generating...
                    </>
                  ) : (
                    <>
                      <FaComments className="mr-2" /> Generate Post
                    </>
                  )}
                </button>
              ) : (
                <p className="text-gray-600">Please select an article to generate a post.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Article Preview */}
      {selectedArticle && (
        <div className="mt-8 p-6 bg-white rounded-md shadow-md">
          <h3 className="text-xl font-semibold text-blue-600 mb-4">Article Preview</h3>
          <div className="p-4 border border-gray-300 rounded-md bg-gray-50">
            <h4 className="text-lg font-bold mb-2">{selectedArticle.title}</h4>
            <p className="text-gray-700 mb-4">{selectedArticle.description || 'No description available.'}</p>
            <a
              href={selectedArticle.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline font-medium"
            >
              Read more
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

ReactDOM.render(<ContentGenerator />, document.getElementById('root'));
