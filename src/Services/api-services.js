// src/Services/api-services.js

/**
 * APIService Class
 * Handles interactions with the AI API for generating content.
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
                    'commentCustomModel',  // ← added
                    'postAiModel',
                    'postCustomModel',     // ← added
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
     * @param {string} [customModel] - The custom model identifier if model is 'custom'.
     * @returns {Promise<string>} The generated text from the AI.
     */
    static async makeApiRequest(prompt, settings, model, temperature, maxTokens, customModel) {
        const apiBaseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/';
        let modelToUse = model;
        if (model === 'custom') {
            if (customModel && customModel.trim()) {
                modelToUse = customModel.trim();
            } else {
                throw new Error("Custom model not specified in settings. Please enter a valid model identifier (e.g., 'gemini-2.0-flash') in extension options or select a different model.");
            }
        }
        const apiUrl = `${apiBaseUrl}${modelToUse}:generateContent?key=${settings.apiKey}`;

        console.log('🔹 Sending request to AI API:', { prompt, apiUrl, model: modelToUse, temperature, maxTokens });

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
     * Validates the API key format.
     * @param {string} apiKey - The API key to validate.
     */
    static validateApiKey(apiKey) {
        if (!apiKey) {
            throw new Error('API key not configured. Please go to extension options and enter your Google AI API key.');
        }

        if (!/^[A-Za-z0-9-_]+$/.test(apiKey)) {
            throw new Error('Invalid API key format. Please check your API key in the extension options.');
        }
    }
}
