// src/background/background.js

import { APIService } from './api-services.js'; // Adjust the path as necessary

// Listener for messages from other parts of the extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);

  if (message.action === 'fetchArticle') {
    const { url } = message;
    console.log('Fetching article from:', url);

    // Fetch the article content
    fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        return response.text();
      })
      .then((htmlString) => {
        console.log('Article fetched successfully.');
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
    console.log(`Generating comment for poster: ${posterName}`);

    APIService.generateComment(posterName, articleContent)
      .then((comment) => {
        console.log('Comment generated successfully.');
        sendResponse({ comment });
      })
      .catch((error) => {
        console.error('Error generating comment:', error);
        sendResponse({ error: 'Failed to generate comment.' });
      });

    // Indicate that the response will be sent asynchronously
    return true;
  }

  // Handle unknown actions
  console.warn('Unknown action:', message.action);
});
