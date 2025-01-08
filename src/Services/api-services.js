// src/Services/api-services.js

/**
 * APIService Class
 * Handles interactions with the AI API for generating LinkedIn posts and comments.
 */

export class APIService {
    /**
     * Retrieves settings from chrome.storage.sync
     * @returns {Promise<Object>} An object containing all relevant settings.
     */
    static async getSettings() {
        return new Promise((resolve, reject) => {
            chrome.storage.sync.get(
                [
                    'apiKey',
                    'defaultCommentPrompt',
                    'defaultPostPrompt',
                    'commentAiModel',
                    'postAiModel',
                    'commentTemperature',
                    'postTemperature',
                    'commentMaxTokens',
                    'postMaxTokens',
                    'blacklist'
                ],
                (result) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                    } else {
                        resolve(result);
                    }
                }
            );
        });
    }

    /**
     * Makes a POST request to the AI API.
     * @param {string} prompt - The prompt to send to the AI model.
     * @param {Object} settings - The settings retrieved from storage.
     * @param {string} model - The AI model to use.
     * @param {number} temperature - The randomness of the AI's response.
     * @param {number} maxTokens - The maximum number of tokens to generate.
     * @returns {Promise<string>} The generated text from the AI.
     */
    static async makeApiRequest(prompt, settings, model, temperature, maxTokens) {
        const apiBaseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/';
        const apiUrl = `${apiBaseUrl}${model}:generateContent?key=${settings.apiKey}`;

        console.log('🔹 Sending request to AI API:', { prompt, apiUrl, model, temperature, maxTokens });

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: temperature,
                    maxOutputTokens: maxTokens,
                }
            })
        });

        const responseData = await response.json().catch(() => ({}));
        console.log('🔹 AI API Response:', responseData);

        if (!response.ok) {
            throw new Error(
                responseData.error?.message || 
                `API request failed with status ${response.status}.`
            );
        }

        if (
            responseData.candidates &&
            responseData.candidates[0]?.content?.parts?.[0]?.text
        ) {
            let generatedText = responseData.candidates[0].content.parts[0].text.trim();

            // Apply blacklist filtering if configured
            if (settings.blacklist) {
                const blacklistWords = settings.blacklist.split('\n')
                    .map(word => word.trim())
                    .filter(word => word);
                if (blacklistWords.length > 0) {
                    const regex = new RegExp(blacklistWords.join('|'), 'gi');
                    generatedText = generatedText.replace(regex, '***');
                }
            }

            return generatedText;
        } else {
            console.error('❌ Unexpected response format from AI API:', responseData);
            throw new Error('The AI service returned an unexpected response format. Please try again.');
        }
    }

    /**
     * Generates a LinkedIn Post with Website Context
     * @param {string} articleContent - The content of the article.
     * @param {string} feedName - The name of the RSS feed.
     * @param {string} websiteURL - The source website URL.
     * @param {string} websiteContent - Extracted content from the website.
     * @returns {Promise<string>} The generated LinkedIn post.
     */
    static async generatePost(articleContent, feedName, websiteURL, websiteContent) {
        try {
            const settings = await this.getSettings();

            // Validate API Key
            if (!settings.apiKey) {
                throw new Error('API key not configured. Please go to extension options and enter your Google AI API key.');
            }

            if (!/^[A-Za-z0-9-_]+$/.test(settings.apiKey)) {
                throw new Error('Invalid API key format. Please check your API key in the extension options.');
            }

            // Validate Inputs
            if (!articleContent || !feedName || !websiteURL) {
                throw new Error('Missing required content for post generation.');
            }

            // Construct Post Prompt with Website Context
            const prompt = settings.defaultPostPrompt
                ? settings.defaultPostPrompt
                    .replace('{content}', articleContent)
                    .replace('{feedName}', feedName)
                    .replace('{website}', websiteURL)
                : `Create a LinkedIn post based on the article from ${websiteURL} titled "${articleContent}". The RSS feed name is ${feedName}.`;

            console.log('🔹 Final Prompt for generatePost:', prompt);

            // Make API Request
            const post = await this.makeApiRequest(
                prompt,
                settings,
                settings.postAiModel || 'gemini-pro',
                settings.postTemperature || 0.7,
                settings.postMaxTokens || 150
            );

            return post;
        } catch (error) {
            console.error('❌ Error generating post:', error.message || error);
            throw new Error(`Failed to generate post: ${error.message}`);
        }
    }

    /**
     * Generates a LinkedIn Comment based on the post content.
     * @param {string} postContent - The content of the LinkedIn post.
     * @param {string} posterName - The name of the post's author.
     * @returns {Promise<string>} The generated comment.
     */
    static async generateComment(postContent, posterName) {
        try {
            const settings = await this.getSettings();

            // Validate API Key
            if (!settings.apiKey) {
                throw new Error('API key not configured. Please go to extension options and enter your Google AI API key.');
            }

            if (!/^[A-Za-z0-9-_]+$/.test(settings.apiKey)) {
                throw new Error('Invalid API key format. Please check your API key in the extension options.');
            }

            // Validate Inputs
            if (!postContent || !posterName) {
                throw new Error('Missing required content for comment generation.');
            }

            // Construct Comment Prompt
            const prompt = settings.defaultCommentPrompt
                ? settings.defaultCommentPrompt
                    .replace('{postContent}', postContent)
                    .replace('{name}', posterName)
                : `Write a thoughtful and engaging LinkedIn comment for a post by ${posterName}. The post content is: "${postContent}"`;

            console.log('🔹 Final Prompt for generateComment:', prompt);

            // Make API Request
            const comment = await this.makeApiRequest(
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
