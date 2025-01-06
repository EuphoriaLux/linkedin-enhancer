// src/components/Options/Options.jsx

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import './Options.css'; // Ensure this file exists in the same directory

const ApiRequestConfig = ({ title, prompt, setPrompt, aiModel, setAiModel, temperature, setTemperature, maxTokens, setMaxTokens }) => {
    return (
        <div className="api-config-section">
            <h2>{title}</h2>
            <div className="section">
                <label>Prompt:</label>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={`Enter your default prompt for ${title.toLowerCase()}...`}
                    rows="4"
                ></textarea>
                <small>
                    Customize the default prompt used for generating {title.toLowerCase()}. 
                    Use placeholders like <code>{'{content}'}</code> and <code>{'{name}'}</code> as needed.
                </small>
            </div>
            <div className="section">
                <label>AI Model:</label>
                <select
                    value={aiModel}
                    onChange={(e) => setAiModel(e.target.value)}
                >
                    <option value="gemini-pro">Gemini Pro</option>
                    <option value="gemini-basic">Gemini Basic</option>
                </select>
            </div>
            <div className="section">
                <label>Temperature:</label>
                <input
                    type="number"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                    step="0.1"
                    min="0"
                    max="1"
                />
            </div>
            <div className="section">
                <label>Max Tokens:</label>
                <input
                    type="number"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(e.target.value)}
                    min="50"
                    max="1000"
                />
            </div>
        </div>
    );
};

const Options = () => {
    const [apiKey, setApiKey] = useState('');
    const [defaultCommentPrompt, setDefaultCommentPrompt] = useState('');
    const [defaultPostPrompt, setDefaultPostPrompt] = useState('');
    const [commentAiModel, setCommentAiModel] = useState('gemini-pro');
    const [commentTemperature, setCommentTemperature] = useState(0.7);
    const [commentMaxTokens, setCommentMaxTokens] = useState(150);
    const [postAiModel, setPostAiModel] = useState('gemini-pro');
    const [postTemperature, setPostTemperature] = useState(0.7);
    const [postMaxTokens, setPostMaxTokens] = useState(150);
    const [blacklist, setBlacklist] = useState('');
    const [status, setStatus] = useState({ message: '', type: '' });

    // Load settings from chrome.storage.sync on component mount
    useEffect(() => {
        chrome.storage.sync.get(
            [
                'apiKey',
                'defaultCommentPrompt',
                'defaultPostPrompt',
                'commentAiModel',
                'commentTemperature',
                'commentMaxTokens',
                'postAiModel',
                'postTemperature',
                'postMaxTokens',
                'blacklist'
            ],
            (result) => {
                setApiKey(result.apiKey || '');
                setDefaultCommentPrompt(result.defaultCommentPrompt || '');
                setDefaultPostPrompt(result.defaultPostPrompt || '');
                setCommentAiModel(result.commentAiModel || 'gemini-pro');
                setCommentTemperature(result.commentTemperature || 0.7);
                setCommentMaxTokens(result.commentMaxTokens || 150);
                setPostAiModel(result.postAiModel || 'gemini-pro');
                setPostTemperature(result.postTemperature || 0.7);
                setPostMaxTokens(result.postMaxTokens || 150);
                setBlacklist(result.blacklist || '');
            }
        );
    }, []);

    const saveSettings = () => {
        if (!apiKey.trim()) {
            setStatus({ message: 'API key cannot be empty.', type: 'error' });
            return;
        }

        chrome.storage.sync.set(
            {
                apiKey: apiKey.trim(),
                defaultCommentPrompt: defaultCommentPrompt.trim(),
                defaultPostPrompt: defaultPostPrompt.trim(),
                commentAiModel: commentAiModel.trim(),
                commentTemperature: parseFloat(commentTemperature),
                commentMaxTokens: parseInt(commentMaxTokens, 10),
                postAiModel: postAiModel.trim(),
                postTemperature: parseFloat(postTemperature),
                postMaxTokens: parseInt(postMaxTokens, 10),
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
            
            <div className="section">
                <label>Google AI API Key:</label>
                <input
                    type="text"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your API key..."
                />
            </div>

            <ApiRequestConfig
                title="Comment Configuration"
                prompt={defaultCommentPrompt}
                setPrompt={setDefaultCommentPrompt}
                aiModel={commentAiModel}
                setAiModel={setCommentAiModel}
                temperature={commentTemperature}
                setTemperature={setCommentTemperature}
                maxTokens={commentMaxTokens}
                setMaxTokens={setCommentMaxTokens}
            />

            <ApiRequestConfig
                title="Post Configuration"
                prompt={defaultPostPrompt}
                setPrompt={setDefaultPostPrompt}
                aiModel={postAiModel}
                setAiModel={setPostAiModel}
                temperature={postTemperature}
                setTemperature={setPostTemperature}
                maxTokens={postMaxTokens}
                setMaxTokens={setPostMaxTokens}
            />

            <button onClick={saveSettings} className="button button-primary">Save Settings</button>
            {status.message && <div className={`status ${status.type}`}>{status.message}</div>}
        </div>
    );
};

ReactDOM.render(<Options />, document.getElementById('root'));
