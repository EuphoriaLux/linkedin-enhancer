// src/Services/postService.js

import { APIService } from './api-services.js';

/**
 * PostService Class
 * Handles the generation of LinkedIn posts.
 */
export class PostService {
    /**
     * Generates a LinkedIn Post with Website Context
     * @param {string} articleContent - The short content from the RSS feed.
     * @param {string} feedName - The name of the RSS feed.
     * @param {string} websiteURL - The source website URL.
     * @param {string} websiteContent - Extracted content from the website.
     * @returns {Promise<string>} The generated LinkedIn post.
     */
    static async generatePost(articleContent, feedName, websiteURL, websiteContent) {
        try {
            const settings = await APIService.getSettings();

            // Validate API Key
            APIService.validateApiKey(settings.apiKey);

            // Validate Inputs
            if (!articleContent || !feedName || !websiteURL || !websiteContent) {
                throw new Error('Missing required content for post generation.');
            }

            // Debugging Logs
            console.log('🔹 Article Content:', articleContent);
            console.log('🔹 Feed Name:', feedName);
            console.log('🔹 Website URL:', websiteURL);
            console.log('🔹 Website Content:', websiteContent);

            // Construct Post Prompt with Placeholder Replacement
            const prompt = settings.defaultPostPrompt
                ? settings.defaultPostPrompt
                    .replace('{articleContent}', articleContent)
                    .replace('{feedName}', feedName)
                    .replace('{websiteURL}', websiteURL)
                    .replace('{websiteContent}', websiteContent)
                : `Create a LinkedIn post based on the article from ${websiteURL} titled "${articleContent}". The RSS feed name is ${feedName}. Content: ${websiteContent}`;

            console.log('🔹 Final Prompt for generatePost:', prompt);

            // Ensure no unresolved placeholders remain
            if (prompt.includes('{') && prompt.includes('}')) {
                console.error('❌ Unresolved placeholders detected in the prompt:', prompt);
                throw new Error('Prompt contains unresolved placeholders.');
            }

            // NEW: Determine correct AI Model for post generation
            let postModel = settings.postAiModel || 'gemini-pro';
            if (postModel === 'custom') {
                if (!settings.postCustomModel.trim()) {
                    throw new Error('Custom model not specified in settings.');
                }
                postModel = settings.postCustomModel.trim();
            }

            // Make API Request
            const post = await APIService.makeApiRequest(
                prompt,
                settings,
                postModel,
                settings.postTemperature || 0.7,
                settings.postMaxTokens || 150
            );

            return post;
        } catch (error) {
            console.error('❌ Error generating post:', error.message || error);
            throw new Error(`Failed to generate post: ${error.message}`);
        }
    }
}
