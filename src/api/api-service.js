class APIService {
    static async generateComment(postContent, posterName) {
        try {
            const settings = await chrome.storage.sync.get(['apiKey', 'defaultPrompt', 'aiModel', 'temperature', 'maxTokens', 'blacklist']);
            
            if (!settings.apiKey) {
                throw new Error('API key not configured. Please go to extension options and enter your Google AI API key.');
            }

            if (!settings.apiKey.match(/^[A-Za-z0-9-_]+$/)) {
                throw new Error('Invalid API key format. Please check your API key in the extension options.');
            }

            if (!postContent || !posterName) {
                throw new Error('Missing required content for comment generation.');
            }

            const prompt = settings.defaultPrompt
                ? settings.defaultPrompt
                    .replace('{content}', postContent)
                    .replace('{name}', posterName)
                : `Generate a professional comment for LinkedIn post by ${posterName}: "${postContent}"`;

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
        } catch (error) {
            console.error('Error generating comment:', error);
            // Enhance error message for user display
            const userMessage = error.message.includes('API key') 
                ? error.message 
                : `Failed to generate comment: ${error.message}`;
            throw new Error(userMessage);
        }
    }
}
