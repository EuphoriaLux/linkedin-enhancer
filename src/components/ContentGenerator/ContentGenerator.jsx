// src/components/ContentGenerator/ContentGenerator.jsx

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { FaCopy, FaCheckCircle } from 'react-icons/fa';
import { Readability } from '@mozilla/readability';
import './ContentGenerator.css';

// Placeholder Images
const PLACEHOLDER_FEED_IMAGE = 'https://via.placeholder.com/50?text=Feed';
const PLACEHOLDER_ARTICLE_IMAGE = 'https://via.placeholder.com/600x400?text=No+Image';

const ContentGenerator = () => {
  // State variables
  const [posterName, setPosterName] = useState('');
  const [generatedComment, setGeneratedComment] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  // RSS Feed Management
  const [rssFeeds, setRssFeeds] = useState([]);
  const [selectedFeed, setSelectedFeed] = useState('');
  const [feedTitle, setFeedTitle] = useState('');
  const [feedImage, setFeedImage] = useState('');
  const [articles, setArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState('');
  const [articleTitle, setArticleTitle] = useState('');
  const [articleImage, setArticleImage] = useState('');
  const [isFetchingArticles, setIsFetchingArticles] = useState(false);
  const [isFetchingContent, setIsFetchingContent] = useState(false);
  const [articleContent, setArticleContent] = useState('');
  const [editableContent, setEditableContent] = useState('');
  const [errorMessage, setErrorMessage] = useState(''); // New state for error messages

  // Load RSS feeds from chrome.storage on component mount
  useEffect(() => {
    const loadRssFeeds = () => {
      chrome.storage.sync.get(['rssFeeds'], (result) => {
        if (result.rssFeeds) {
          setRssFeeds(result.rssFeeds);
          console.log('RSS Feeds Loaded:', result.rssFeeds);
        } else {
          setRssFeeds([]);
          console.log('No RSS Feeds Found.');
        }
      });
    };

    loadRssFeeds();

    // Listener for storage changes
    const handleStorageChange = (changes, area) => {
      if (area === 'sync' && changes.rssFeeds) {
        setRssFeeds(changes.rssFeeds.newValue || []);
        console.log('RSS Feeds Updated:', changes.rssFeeds.newValue);
        // Reset selected feed and articles if the feeds change
        setSelectedFeed('');
        setFeedTitle('');
        setFeedImage('');
        setArticles([]);
        setSelectedArticle('');
        setArticleTitle('');
        setArticleImage('');
        setArticleContent('');
        setEditableContent('');
        setErrorMessage('');
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    // Cleanup listener on component unmount
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  // Fetch articles when a new feed is selected
  useEffect(() => {
    if (selectedFeed) {
      console.log('Selected Feed URL:', selectedFeed);
      fetchArticlesFromFeed(selectedFeed);
    } else {
      setArticles([]);
      setSelectedArticle('');
      setArticleTitle('');
      setArticleImage('');
      setArticleContent('');
      setEditableContent('');
    }
  }, [selectedFeed]);

  // Function to fetch articles from the selected RSS feed
  const fetchArticlesFromFeed = async (feedUrl) => {
    setIsFetchingArticles(true); // Start loading articles
    setErrorMessage(''); // Reset any existing error messages
    try {
      chrome.runtime.sendMessage(
        {
          action: 'fetchRSSFeed',
          feedUrl,
        },
        (response) => {
          if (response && response.feed) {
            setFeedTitle(response.feed.title);
            setFeedImage(response.feed.image || PLACEHOLDER_FEED_IMAGE);
            setArticles(response.feed.items);
            setSelectedArticle('');
            setArticleTitle('');
            setArticleImage('');
            setArticleContent('');
            setEditableContent('');
            console.log('Feed Title:', response.feed.title);
            console.log('Feed Image URL:', response.feed.image || PLACEHOLDER_FEED_IMAGE);
            console.log('Fetched Articles:', response.feed.items);
          } else if (response && response.error) {
            setErrorMessage('Failed to fetch articles from the selected RSS feed.');
            setArticles([]);
            console.error('RSS Fetch Error:', response.error);
          }
          setIsFetchingArticles(false); // End loading articles
        }
      );
    } catch (error) {
      console.error('Error fetching RSS feed:', error);
      setErrorMessage('An error occurred while fetching the RSS feed.');
      setArticles([]);
      setIsFetchingArticles(false); // End loading articles
    }
  };

  // Function to fetch and extract article content via background script
  const fetchArticleContent = async (articleUrl) => {
    setIsFetchingContent(true); // Start loading content
    setErrorMessage(''); // Reset any existing error messages
    try {
      // Send message to background script to fetch the article HTML
      chrome.runtime.sendMessage(
        {
          action: 'fetchArticle',
          url: articleUrl,
        },
        (response) => {
          if (response && response.html) {
            console.log('Fetched Article HTML:', response.html);
            // Parse the HTML and extract content using Readability
            const parser = new DOMParser();
            const doc = parser.parseFromString(response.html, 'text/html');
            const reader = new Readability(doc);
            const article = reader.parse();

            if (article && article.textContent) {
              setArticleContent(article.textContent);
              setEditableContent(article.textContent);
              console.log('Article Content:', article.textContent);

              // Extract first image from content if thumbnail is missing
              const tempDiv = document.createElement('div');
              tempDiv.innerHTML = article.content || '';
              const firstImg = tempDiv.querySelector('img');
              if (firstImg) {
                setArticleImage(firstImg.src);
                console.log('Extracted Article Image:', firstImg.src);
              } else {
                setArticleImage(PLACEHOLDER_ARTICLE_IMAGE);
                console.log('No image found in article content. Using placeholder.');
              }
            } else {
              setErrorMessage('Failed to extract content from the selected article.');
              setArticleContent('');
              setEditableContent('');
              setArticleImage(PLACEHOLDER_ARTICLE_IMAGE);
              console.error('Readability Parsing Failed:', article);
            }
          } else if (response && response.error) {
            setErrorMessage(response.error);
            console.error('Fetch Article Error:', response.error);
          }
          setIsFetchingContent(false); // End loading content
        }
      );
    } catch (error) {
      console.error('Error fetching article content:', error);
      setErrorMessage('An error occurred while fetching the article content.');
      setArticleContent('');
      setEditableContent('');
      setArticleImage(PLACEHOLDER_ARTICLE_IMAGE);
      setIsFetchingContent(false); // End loading content
    }
  };

  // Fetch article content when an article is selected
  useEffect(() => {
    if (selectedArticle) {
      const selected = articles.find((article) => article.link === selectedArticle);
      if (selected) {
        setArticleTitle(selected.title);
        setArticleImage(selected.thumbnail || PLACEHOLDER_ARTICLE_IMAGE);
        console.log('Selected Article:', selected.title);
        console.log('Article Image URL:', selected.thumbnail || PLACEHOLDER_ARTICLE_IMAGE);
        fetchArticleContent(selected.link);
      }
    } else {
      setArticleTitle('');
      setArticleImage('');
      setArticleContent('');
      setEditableContent('');
    }
  }, [selectedArticle, articles]);

  // Handle form submission to generate comment
  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate that an article is selected and content is fetched
    if (!selectedArticle) {
      setErrorMessage('Please select an article from the RSS feed.');
      return;
    }

    if (isFetchingContent) {
      setErrorMessage('Please wait until the article content is fetched.');
      return;
    }

    if (!editableContent.trim()) {
      setErrorMessage('Failed to retrieve article content.');
      return;
    }

    // Communicate with background script to generate comment
    chrome.runtime.sendMessage(
      {
        action: 'generateComment',
        posterName,
        articleContent: editableContent, // Pass the editable article content
      },
      (response) => {
        if (response && response.comment) {
          setGeneratedComment(response.comment);
          setCopySuccess(false);
          console.log('Generated Comment:', response.comment);
        } else if (response && response.error) {
          setErrorMessage(response.error);
          console.error('Generate Comment Error:', response.error);
        }
      }
    );
  };

  // Handle copying the generated comment to clipboard
  const handleCopy = () => {
    if (!generatedComment) return;

    navigator.clipboard
      .writeText(generatedComment)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 3000);
      })
      .catch((err) => {
        console.error('Failed to copy: ', err);
        setErrorMessage('Failed to copy comment.');
      });
  };

  return (
    <div className="content-generator-container">
      <h1>Content Generator</h1>

      {/* Inform user if no RSS feeds are available */}
      {rssFeeds.length === 0 && (
        <div className="no-rss-feeds">
          <p>
            No RSS feeds available. Please add RSS feeds in the{' '}
            <a href="options.html" target="_blank" rel="noopener noreferrer">
              Options
            </a>{' '}
            page.
          </p>
        </div>
      )}

      {/* Display Error Messages */}
      {errorMessage && (
        <div className="error-message">
          {errorMessage}
        </div>
      )}

      {/* Form to generate comment */}
      <form onSubmit={handleSubmit}>
        {/* RSS Feed Selection */}
        {rssFeeds.length > 0 && (
          <>
            <label htmlFor="rssFeed">Select RSS Feed:</label>
            <select
              id="rssFeed"
              value={selectedFeed}
              onChange={(e) => setSelectedFeed(e.target.value)}
              required
            >
              <option value="">-- Select a Feed --</option>
              {rssFeeds.map((feed, index) => (
                <option key={index} value={feed.url}>
                  {feed.title || feed.url}
                </option>
              ))}
            </select>
            {/* Display Feed Title and Image */}
            {feedTitle && (
              <div className="feed-info">
                <img
                  src={feedImage || PLACEHOLDER_FEED_IMAGE}
                  alt={`${feedTitle} logo`}
                  className="feed-image"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = PLACEHOLDER_FEED_IMAGE;
                  }}
                />
                <span className="feed-title">{feedTitle}</span>
              </div>
            )}
          </>
        )}

        {/* Article Selection */}
        {selectedFeed && (
          <>
            <label htmlFor="article">Select Article:</label>
            <select
              id="article"
              value={selectedArticle}
              onChange={(e) => setSelectedArticle(e.target.value)}
              required
            >
              <option value="">-- Select an Article --</option>
              {articles.map((article, index) => (
                <option key={index} value={article.link}>
                  {article.title}
                </option>
              ))}
            </select>
            {/* Loading Indicator */}
            {isFetchingArticles && <div className="spinner">Loading articles...</div>}
            {!isFetchingArticles && articles.length === 0 && (
              <p>No articles found for this feed.</p>
            )}
          </>
        )}

        {/* Article Details */}
        {selectedArticle && (
          <>
            {/* Article Title */}
            {articleTitle && <h3 className="article-title">{articleTitle}</h3>}

            {/* Article Image */}
            {articleImage && (
              <img
                src={articleImage}
                alt="Article Thumbnail"
                className="article-image"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = PLACEHOLDER_ARTICLE_IMAGE;
                }}
              />
            )}

            {/* Loading Indicator for Content */}
            {isFetchingContent && <div className="spinner">Fetching article content...</div>}

            {/* Editable Content Preview */}
            {articleContent && (
              <div className="article-content-preview">
                <h4>Article Content Preview:</h4>
                <textarea
                  value={editableContent}
                  onChange={(e) => setEditableContent(e.target.value)}
                  rows="6"
                  placeholder="Edit the extracted content if necessary..."
                ></textarea>
                <p>
                  <em>
                    The content above will be used to generate your AI comment. You can edit it if necessary.
                  </em>
                </p>
              </div>
            )}
          </>
        )}

        {/* Poster Name Input */}
        {selectedArticle && (
          <>
            <label htmlFor="posterName">Poster Name:</label>
            <input
              type="text"
              id="posterName"
              value={posterName}
              onChange={(e) => setPosterName(e.target.value)}
              required
              placeholder="Enter the name of the poster..."
            />
          </>
        )}

        {/* Submit Button */}
        {selectedArticle && (
          <button type="submit" className="button button-primary copy-button">
            Generate Comment
          </button>
        )}
      </form>

      {/* Generated Comment Section */}
      {generatedComment && (
        <div className="generated-comment">
          <h2>Generated Comment:</h2>
          <p>{generatedComment}</p>
          <button onClick={handleCopy} className="button button-secondary copy-button">
            {copySuccess ? (
              <>
                <FaCheckCircle className="icon success-icon" /> Copied!
              </>
            ) : (
              <>
                <FaCopy className="icon" /> Copy to Clipboard
              </>
            )}
          </button>
          {copySuccess && (
            <div className={`copy-feedback ${copySuccess ? 'feedback-success' : 'feedback-error'}`}>
              {copySuccess ? 'Copied!' : 'Failed to copy.'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

ReactDOM.render(<ContentGenerator />, document.getElementById('root'));
