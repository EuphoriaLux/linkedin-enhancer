// src/background/background.js

import { PostService } from '../Services/postService.js';
import { CommentService } from '../Services/commentService.js';
import RSSParser from 'rss-parser';
import { extractArticleContent } from '../Utils/contentExtractor.js';
import { Buffer } from 'buffer';
import process from 'process/browser'; // Remove if not used

const parser = new RSSParser();

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Validates if a string is a valid URL.
 * @param {string} urlString
 * @returns {boolean}
 */
function isValidUrl(urlString) {
    try {
        new URL(urlString);
        return true;
    } catch (_) {
        return false;
    }
}

/**
 * Fetches RSS feed either from cache or network.
 * @param {string} feedUrl
 * @returns {Promise<Object>}
 */
const fetchRSSFeed = async (feedUrl) => {
    const cachedFeed = await getCachedFeed(feedUrl);
    if (cachedFeed) {
        console.log('🔄 Serving feed from cache:', feedUrl);
        return cachedFeed.feed;
    }

    console.log('🔄 Fetching feed from network:', feedUrl);
    const response = await fetchWithTimeout(feedUrl, {}, 10000);

    if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
    }

    const feedData = await parser.parseString(await response.text());

    const feed = {
        title: feedData.title || 'No Title',
        url: feedUrl,
        image: feedData.image?.url || 'https://via.placeholder.com/50?text=Feed',
        items: feedData.items.map(item => ({
            title: item.title || 'No Title',
            link: item.link || '',
            description: item.contentSnippet || item.content || item.summary || '',
            pubDate: item.pubDate || '',
            image: extractImageFromItem(item) || 'https://via.placeholder.com/150?text=No+Image',
        })),
    };

    await cacheFeed(feedUrl, feed);

    return feed;
};

/**
 * Extracts image URL from an RSS feed item.
 * @param {Object} item
 * @returns {string|null}
 */
const extractImageFromItem = (item) => {
    if (item.enclosure && item.enclosure.url && item.enclosure.type.startsWith('image/')) {
        return item.enclosure.url;
    }

    const imgMatch = item.content?.match(/<img[^>]+src="([^">]+)"/);
    if (imgMatch && imgMatch[1]) {
        return imgMatch[1];
    }

    if (item['media:content'] && item['media:content'].url) {
        return item['media:content'].url;
    }

    return null;
};

/**
 * Fetches a URL with a timeout.
 * @param {string} url
 * @param {Object} options
 * @param {number} timeout
 * @returns {Promise<Response>}
 */
const fetchWithTimeout = (url, options = {}, timeout = 10000) => {
    return new Promise((resolve, reject) => {
        const controller = new AbortController();
        const { signal } = controller;
        const fetchOptions = { ...options, signal };

        const timer = setTimeout(() => {
            controller.abort();
            reject(new Error('Fetch timed out'));
        }, timeout);

        fetch(url, fetchOptions)
            .then(response => {
                clearTimeout(timer);
                resolve(response);
            })
            .catch(err => {
                clearTimeout(timer);
                reject(err);
            });
    });
};

/**
 * Retrieves cached feed from chrome.storage.local.
 * @param {string} feedUrl
 * @returns {Promise<Object|null>}
 */
const getCachedFeed = async (feedUrl) => {
    return new Promise((resolve) => {
        chrome.storage.local.get(['rssFeedCache'], (result) => {
            const cache = result.rssFeedCache || {};
            const cached = cache[feedUrl];
            if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
                resolve(cached);
            } else {
                resolve(null);
            }
        });
    });
};

/**
 * Caches feed data into chrome.storage.local.
 * @param {string} feedUrl
 * @param {Object} feed
 * @returns {Promise<void>}
 */
const cacheFeed = async (feedUrl, feed) => {
    return new Promise((resolve) => {
        chrome.storage.local.get(['rssFeedCache'], (result) => {
            const cache = result.rssFeedCache || {};
            cache[feedUrl] = {
                feed,
                timestamp: Date.now(),
            };
            chrome.storage.local.set({ rssFeedCache: cache }, () => {
                resolve();
            });
        });
    });
};

/**
 * Listener for runtime messages.
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('🔹 Background received message:', message);

    if (message.action === 'fetchRSSFeed') {
        const { feedUrl } = message;

        if (!isValidUrl(feedUrl)) {
            const errorMsg = 'Invalid RSS feed URL provided.';
            console.error('❌ Error:', errorMsg);
            sendResponse({ error: errorMsg });
            return;
        }

        fetchRSSFeed(feedUrl)
            .then(feed => {
                console.log('✅ RSS Feed fetched successfully:', feed.title);
                sendResponse({ feed });
            })
            .catch(error => {
                console.error('❌ Error fetching RSS feed:', error.message || error);
                sendResponse({ error: error.message || 'Unknown error occurred.' });
            });

        return true; // Indicates that the response is sent asynchronously
    }

    if (message.action === 'generatePost') {
        const { feedName, articleContent, websiteURL, websiteContent } = message;

        if (!isValidUrl(websiteURL)) {
            const errorMsg = 'Invalid website URL provided.';
            console.error('❌ Error:', errorMsg);
            sendResponse({ error: errorMsg });
            return;
        }

        console.log('🔸 Generating post for Feed:', feedName, 'From Website:', websiteURL);

        // Use PostService instead of APIService
        PostService.generatePost(articleContent, feedName, websiteURL, websiteContent)
            .then(post => {
                if (!post) {
                    throw new Error('PostService returned an empty post.');
                }
                console.log('✅ Post generated successfully:', post);
                sendResponse({ post });
            })
            .catch(error => {
                console.error('❌ Error generating post:', error.message || error);
                sendResponse({ error: error.message || 'Unknown error occurred.' });
            });

        return true; // Indicates that the response is sent asynchronously
    }

    if (message.action === 'generateComment') {
        const { postId, postContent, posterName } = message;

        if (!postContent || !posterName) {
            const errorMsg = 'Missing required data to generate comment.';
            console.error('❌ Error:', errorMsg);
            sendResponse({ error: errorMsg });
            return;
        }

        console.log(`🔸 Generating comment for Post ID: ${postId}, Poster: ${posterName}`);

        // Use CommentService instead of APIService
        CommentService.generateComment(postContent, posterName)
            .then(comment => {
                if (!comment) {
                    throw new Error('CommentService returned an empty comment.');
                }
                console.log('✅ Comment generated successfully:', comment);
                sendResponse({ comment });
            })
            .catch(error => {
                console.error('❌ Error generating comment:', error.message || error);
                sendResponse({ error: error.message || 'Unknown error occurred.' });
            });

        return true; // Indicates that the response is sent asynchronously
    }

    // Handle other actions or ignore
    console.warn('⚠️ Unknown action:', message.action);
});

// Ensure the script doesn't terminate prematurely
process.nextTick(() => {});
