// src/Services/commentService.js

import { APIService } from './api-services.js';

/**
 * CommentService Class
 * Handles the generation of LinkedIn comments.
 */
export class CommentService {
    /**
     * Generates a LinkedIn Comment based on the post content.
     * @param {string} postContent - The content of the LinkedIn post.
     * @param {string} posterName - The name of the post's author.
     * @returns {Promise<string>} The generated comment.
     */
    static async generateComment(postContent, posterName) {
        try {
            const settings = await APIService.getSettings();

            // Validate API Key
            APIService.validateApiKey(settings.apiKey);

            // Validate Inputs
            if (!postContent || !posterName) {
                throw new Error('Missing required data to generate comment.');
            }

            // Construct Comment Prompt
            const prompt = settings.defaultCommentPrompt
                ? settings.defaultCommentPrompt
                    .replace('{postContent}', postContent)
                    .replace('{posterName}', posterName)
                : `Write a thoughtful and engaging LinkedIn comment for a post by ${posterName}. The post content is: "${postContent}"`;

            console.log('🔹 Final Prompt for generateComment:', prompt);

            // Make API Request
            const comment = await APIService.makeApiRequest(
                prompt,
                settings,
                settings.commentAiModel || 'gemini-pro',
                settings.commentTemperature || 0.7,
                settings.commentMaxTokens || 100
            );

            return comment;
        } catch (error) {
            console.error('❌ Error generating comment:', error.message || error);
            throw new Error(`Failed to generate comment: ${error.message}`);
        }
    }
}
