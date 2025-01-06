// src/components/Options/Options.jsx

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import './Options.css'; // Ensure this file exists in the same directory

const Options = () => {
    const [apiKey, setApiKey] = useState('');
    const [defaultPrompt, setDefaultPrompt] = useState('');
    const [aiModel, setAiModel] = useState('gemini-pro');
    const [temperature, setTemperature] = useState(0.7);
    const [maxTokens, setMaxTokens] = useState(150);
    const [blacklist, setBlacklist] = useState('');
    const [status, setStatus] = useState({ message: '', type: '' });

    // Load settings from chrome.storage.sync on component mount
    useEffect(() => {
        chrome.storage.sync.get(
            ['apiKey', 'defaultPrompt', 'aiModel', 'temperature', 'maxTokens', 'blacklist'],
            (result) => {
                setApiKey(result.apiKey || '');
                setDefaultPrompt(result.defaultPrompt || '');
                setAiModel(result.aiModel || 'gemini-pro');
                setTemperature(result.temperature || 0.7);
                setMaxTokens(result.maxTokens || 150);
                setBlacklist(result.blacklist || '');
            }
        );
    }, []);

    // Function to save settings to chrome.storage.sync
    const saveSettings = () => {
        // Basic validation
        if (!apiKey.trim()) {
            setStatus({ message: 'API key cannot be empty.', type: 'error' });
            return;
        }

        // Optionally, validate API key format
        if (!/^[A-Za-z0-9-_]+$/.test(apiKey.trim())) {
            setStatus({ message: 'API key format is invalid.', type: 'error' });
            return;
        }

        // Save to chrome.storage.sync
        chrome.storage.sync.set(
            {
                apiKey: apiKey.trim(),
                defaultPrompt: defaultPrompt.trim(),
                aiModel: aiModel.trim(),
                temperature: parseFloat(temperature),
                maxTokens: parseInt(maxTokens, 10),
                blacklist: blacklist.trim(),
            },
            () => {
                if (chrome.runtime.lastError) {
                    setStatus({ message: `Error saving settings: ${chrome.runtime.lastError.message}`, type: 'error' });
                } else {
                    setStatus({ message: 'Settings saved successfully!', type: 'success' });
                }
            }
        );
    };

    return (
        <div className="options-container">
            <h1>Extension Options</h1>
            
            {/* API Key Configuration */}
            <div className="section">
                <label htmlFor="apiKey">Google AI API Key:</label>
                <input
                    type="text"
                    id="apiKey"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your API key..."
                    required
                />
                <small>
                    Your API key is used to authenticate requests to the Google AI service. 
                    Keep it confidential and do not share it publicly.
                </small>
            </div>
            
            {/* Default Prompt Configuration */}
            <div className="section">
                <label htmlFor="defaultPrompt">Default Prompt:</label>
                <textarea
                    id="defaultPrompt"
                    value={defaultPrompt}
                    onChange={(e) => setDefaultPrompt(e.target.value)}
                    placeholder="Enter your default prompt..."
                    rows="4"
                ></textarea>
                <small>
                    Customize the default prompt used for generating comments and posts. 
                    Use placeholders like <code>{'{content}'}</code> and <code>{'{name}'}</code> as needed.
                </small>
            </div>
            
            {/* AI Model Selection */}
            <div className="section">
                <label htmlFor="aiModel">AI Model:</label>
                <select
                    id="aiModel"
                    value={aiModel}
                    onChange={(e) => setAiModel(e.target.value)}
                >
                    <option value="gemini-pro">Gemini Pro</option>
                    <option value="gemini-basic">Gemini Basic</option>
                    {/* Add more models as needed */}
                </select>
            </div>
            
            {/* Temperature Configuration */}
            <div className="section">
                <label htmlFor="temperature">Temperature:</label>
                <input
                    type="number"
                    id="temperature"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                    step="0.1"
                    min="0"
                    max="1"
                />
                <small>
                    Controls the randomness of the AI's output. Lower values make the output more deterministic.
                </small>
            </div>
            
            {/* Max Tokens Configuration */}
            <div className="section">
                <label htmlFor="maxTokens">Max Tokens:</label>
                <input
                    type="number"
                    id="maxTokens"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(e.target.value)}
                    min="50"
                    max="1000"
                />
                <small>
                    The maximum number of tokens (words) the AI can generate in the response.
                </small>
            </div>
            
            {/* Blacklist Configuration */}
            <div className="section">
                <label htmlFor="blacklist">Blacklist Words:</label>
                <textarea
                    id="blacklist"
                    value={blacklist}
                    onChange={(e) => setBlacklist(e.target.value)}
                    placeholder="Enter words to blacklist, one per line..."
                    rows="4"
                ></textarea>
                <small>
                    Words that should be censored in the generated content. Enter one word per line.
                </small>
            </div>
            
            {/* Save Button */}
            <div className="section">
                <button onClick={saveSettings} className="button button-primary">
                    Save Settings
                </button>
            </div>
            
            {/* Status Message */}
            {status.message && (
                <div className={`status ${status.type}`}>
                    {status.message}
                </div>
            )}
        </div>
    );
};

ReactDOM.render(<Options />, document.getElementById('root'));
