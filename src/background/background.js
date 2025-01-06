// background.js

import { APIService } from './api-services.js'; // Adjust the path as necessary
import { XMLParser } from 'fast-xml-parser'; // Import XML parser

// Initialize XML parser
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '', // Removes prefix from attribute names
});

// Function to parse RSS feed XML using fast-xml-parser
const parseRSSFeed = (xmlString) => {
  try {
    const jsonObj = parser.parse(xmlString);

    // Check if it's a valid RSS feed
    if (!jsonObj.rss || !jsonObj.rss.channel) {
      throw new Error("Invalid RSS feed structure.");
    }

    const channel = jsonObj.rss.channel;

    const feed = {
      title: channel.title || "No Title",
      image: (channel.image && channel.image.url) || "",
      items: [],
    };

    const items = channel.item || [];
    items.forEach((item) => {
      const title = item.title || "No Title";
      const link = item.link || "";
      const description = item.description || "";
      const pubDate = item.pubDate || "";
      const enclosure = item.enclosure || null;
      const thumbnail = enclosure ? enclosure.url : "";

      feed.items.push({
        title,
        link,
        description,
        pubDate,
        thumbnail,
      });
    });

    return feed;
  } catch (error) {
    console.error("Error parsing RSS feed XML:", error);
    throw new Error("Error parsing RSS feed XML.");
  }
};

// Listener for messages from other parts of the extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'fetchArticle') {
    const { url } = message;

    // Fetch the article content
    fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        return response.text();
      })
      .then((htmlString) => {
        sendResponse({ html: htmlString });
      })
      .catch((error) => {
        console.error('Error fetching article:', error);
        sendResponse({ error: 'Failed to fetch article content.' });
      });

    // Indicate that the response will be sent asynchronously
    return true;
  }

  if (message.action === 'generateComment') {
    const { posterName, articleContent } = message;

    APIService.generateComment(posterName, articleContent)
      .then((comment) => {
        sendResponse({ comment });
      })
      .catch((error) => {
        console.error('Error generating comment:', error);
        sendResponse({ error: 'Failed to generate comment.' });
      });

    // Indicate that the response will be sent asynchronously
    return true;
  }

  if (message.action === 'fetchRSSFeed') {
    const { feedUrl } = message;

    fetch(feedUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        return response.text();
      })
      .then((xmlString) => {
        const feed = parseRSSFeed(xmlString);
        sendResponse({ feed });
      })
      .catch((error) => {
        console.error('Error fetching RSS feed:', error);
        sendResponse({ error: 'Failed to fetch or parse RSS feed.' });
      });

    // Indicate that the response will be sent asynchronously
    return true;
  }
});
