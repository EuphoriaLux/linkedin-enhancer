// src/background/background.js

import { APIService } from '../Services/api-services.js';

import { extractArticleContent } from '../Utils/contentExtractor.js';

/**
 * Validate URL format
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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('🔹 Background received message:', message);

    if (message.action === 'generatePost') {
        const { posterName, articleContent, websiteURL } = message;

        // Validate URL
        if (!isValidUrl(websiteURL)) {
            const errorMsg = 'Invalid website URL provided.';
            console.error('❌ Error:', errorMsg);
            sendResponse({ error: errorMsg });
            return;
        }

        console.log('🔸 Generating post for:', posterName, 'From Website:', websiteURL);

        // Step 1: Fetch the full website content
        fetch(websiteURL)
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Failed to fetch website content: ${response.statusText}`);
                }
                return response.text();
            })
            .then((htmlString) => {
                // Step 2: Extract meaningful content
                const extractedContent = extractArticleContent(htmlString);

                console.log('🔹 Extracted Content:', extractedContent.substring(0, 200) + '...');

                // Step 3: Send to APIService for Post Generation
                return APIService.generatePost(
                    `${articleContent}\n\nExtracted Website Content:\n${extractedContent}`,
                    posterName,
                    websiteURL
                );
            })
            .then((post) => {
                if (!post) {
                    throw new Error('APIService returned an empty post.');
                }
                console.log('✅ Post generated successfully:', post);
                sendResponse({ post });
            })
            .catch((error) => {
                console.error('❌ Error generating post:', error.message || error);
                sendResponse({ error: error.message || 'Unknown error occurred.' });
            });

        return true; // Indicates that the response is sent asynchronously
    }

    if (message.action === 'generateComment') {
        const { postId, postContent, posterName } = message;

        // Validate Inputs
        if (!postContent || !posterName) {
            const errorMsg = 'Missing required data to generate comment.';
            console.error('❌ Error:', errorMsg);
            sendResponse({ error: errorMsg });
            return;
        }

        console.log(`🔸 Generating comment for Post ID: ${postId}, Poster: ${posterName}`);

        // Step 1: Use APIService to generate the comment
        APIService.generateComment(postContent, posterName)
            .then((comment) => {
                if (!comment) {
                    throw new Error('APIService returned an empty comment.');
                }
                console.log('✅ Comment generated successfully:', comment);
                sendResponse({ comment });
            })
            .catch((error) => {
                console.error('❌ Error generating comment:', error.message || error);
                sendResponse({ error: error.message || 'Unknown error occurred.' });
            });

        return true; // Indicates that the response is sent asynchronously
    }

    // If the action is not recognized, optionally handle other actions or ignore
    console.warn('⚠️ Unknown action:', message.action);
});
