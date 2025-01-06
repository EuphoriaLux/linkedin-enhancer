// src/background/api-services.js

export class APIService {
    /**
     * Retrieves settings from chrome.storage.sync
     * @returns {Promise<Object>} An object containing all relevant settings.
     */
    static async getSettings() {
        return new Promise((resolve, reject) => {
            chrome.storage.sync.get(
                ['apiKey', 'defaultPrompt', 'aiModel', 'temperature', 'maxTokens', 'blacklist'],
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
     * @returns {Promise<string>} The generated text from the AI.
     */
    static async makeApiRequest(prompt, settings) {
        const apiBaseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/';
        const model = settings.aiModel || 'gemini-pro';
        const apiUrl = `${apiBaseUrl}${model}:generateContent?key=${settings.apiKey}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: settings.temperature || 0.7,
                    maxOutputTokens: settings.maxTokens || 150,
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                errorData.error?.message || 
                `API request failed with status ${response.status}. Please check your API key and try again.`
            );
        }

        const data = await response.json();
        if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
            let generatedText = data.candidates[0].content.parts[0].text.trim();

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
            throw new Error('The AI service returned an unexpected response format. Please try again.');
        }
    }

    /**
     * Generates a comment based on the provided post content and poster name.
     * @param {string} postContent - The content of the post to comment on.
     * @param {string} posterName - The name of the poster.
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

            // Construct Prompt
            const prompt = settings.defaultPrompt
                ? settings.defaultPrompt
                    .replace('{content}', postContent)
                    .replace('{name}', posterName)
                : `Generate a professional comment for LinkedIn post by ${posterName}: "${postContent}"`;

            // Make API Request
            const comment = await this.makeApiRequest(prompt, settings);
            return comment;
        } catch (error) {
            console.error('Error generating comment:', error);
            // Enhance error message for user display
            const userMessage = error.message.includes('API key') 
                ? error.message 
                : `Failed to generate comment: ${error.message}`;
            throw new Error(userMessage);
        }
    }

    /**
     * Generates a full LinkedIn post based on the provided article content and poster name.
     * @param {string} articleContent - The content of the article to base the post on.
     * @param {string} posterName - The name of the poster.
     * @returns {Promise<string>} The generated LinkedIn post.
     */
    static async generatePost(articleContent, posterName) {
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
            if (!articleContent || !posterName) {
                throw new Error('Missing required content for post generation.');
            }

            // Construct Prompt
            const prompt = settings.defaultPrompt
                ? settings.defaultPrompt
                    .replace('{content}', articleContent)
                    .replace('{name}', posterName)
                : `Create a comprehensive LinkedIn post by ${posterName} based on the following article content: "${articleContent}"`;

            // Make API Request
            const post = await this.makeApiRequest(prompt, settings);
            return post;
        } catch (error) {
            console.error('Error generating post:', error);
            // Enhance error message for user display
            const userMessage = error.message.includes('API key') 
                ? error.message 
                : `Failed to generate post: ${error.message}`;
            throw new Error(userMessage);
        }
    }
}
