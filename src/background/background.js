// src/background/background.js

import { APIService } from '../Services/api-services.js';
import RSSParser from 'rss-parser';
import { extractArticleContent } from '../Utils/contentExtractor.js';
import { Buffer } from 'buffer';
import process from 'process/browser';

const parser = new RSSParser();

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

function isValidUrl(urlString) {
    try {
        new URL(urlString);
        return true;
    } catch (_) {
        return false;
    }
}

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
        const { posterName, articleContent, websiteURL } = message;

        if (!isValidUrl(websiteURL)) {
            const errorMsg = 'Invalid website URL provided.';
            console.error('❌ Error:', errorMsg);
            sendResponse({ error: errorMsg });
            return;
        }

        console.log('🔸 Generating post for:', posterName, 'From Website:', websiteURL);

        APIService.generatePost(articleContent, posterName, websiteURL)
            .then(post => {
                if (!post) {
                    throw new Error('APIService returned an empty post.');
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

        APIService.generateComment(postContent, posterName)
            .then(comment => {
                if (!comment) {
                    throw new Error('APIService returned an empty comment.');
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
