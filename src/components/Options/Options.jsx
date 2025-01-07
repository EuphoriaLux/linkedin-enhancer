// src/components/Options/Options.jsx

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { FaSave, FaExclamationCircle, FaCheckCircle } from 'react-icons/fa';
import classNames from 'classnames'; // Ensure classnames is installed
import '../../assets/styles/styles.css'; // Corrected relative path



const ApiRequestConfig = ({
  title,
  prompt,
  setPrompt,
  aiModel,
  setAiModel,
  temperature,
  setTemperature,
  maxTokens,
  setMaxTokens,
}) => {
  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">{title}</h2>
      
      {/* Prompt Section */}
      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-2">Prompt:</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={`Enter your default prompt for ${title.toLowerCase()}...`}
          rows="4"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        ></textarea>
        <small className="text-gray-500 mt-1 block">
          Customize the default prompt used for generating {title.toLowerCase()}. Use placeholders like{' '}
          <code className="bg-gray-200 px-1 rounded">{'{content}'}</code> and{' '}
          <code className="bg-gray-200 px-1 rounded">{'{name}'}</code> as needed.
        </small>
      </div>
      
      {/* AI Model Selection */}
      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-2">AI Model:</label>
        <select
          value={aiModel}
          onChange={(e) => setAiModel(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="gemini-pro">Gemini Pro</option>
          <option value="gemini-basic">Gemini Basic</option>
        </select>
      </div>
      
      {/* Temperature Input */}
      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-2">Temperature:</label>
        <input
          type="number"
          value={temperature}
          onChange={(e) => setTemperature(e.target.value)}
          step="0.1"
          min="0"
          max="1"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>
      
      {/* Max Tokens Input */}
      <div>
        <label className="block text-gray-700 font-medium mb-2">Max Tokens:</label>
        <input
          type="number"
          value={maxTokens}
          onChange={(e) => setMaxTokens(e.target.value)}
          min="50"
          max="1000"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
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
        'blacklist',
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
    <div className="max-w-4xl mx-auto p-6 bg-gray-100 min-h-screen">
      {/* Header */}
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Extension Options</h1>

      {/* API Key Section */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <label className="block text-gray-700 font-medium mb-2">Google AI API Key:</label>
        <input
          type="text"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Enter your API key..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {/* Comment Configuration */}
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

      {/* Post Configuration */}
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

      {/* Blacklist Section */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <label className="block text-gray-700 font-medium mb-2">Blacklist:</label>
        <textarea
          value={blacklist}
          onChange={(e) => setBlacklist(e.target.value)}
          placeholder="Enter words to blacklist, separated by commas..."
          rows="4"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        ></textarea>
        <small className="text-gray-500 mt-1 block">
          Enter words to blacklist. These words will be excluded from generated content.
        </small>
      </div>

      {/* Save Button */}
      <div className="flex items-center">
        <button
          onClick={saveSettings}
          className="flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover transition duration-200"
        >
          <FaSave className="mr-2" /> Save Settings
        </button>
        {status.message && (
          <div
            className={classNames(
              'flex items-center ml-4 px-4 py-2 rounded-md',
              {
                'bg-green-100 text-green-800': status.type === 'success',
                'bg-red-100 text-red-800': status.type === 'error',
              }
            )}
          >
            {status.type === 'success' ? (
              <FaCheckCircle className="mr-2" />
            ) : (
              <FaExclamationCircle className="mr-2" />
            )}
            {status.message}
          </div>
        )}
      </div>
    </div>
  );
};

ReactDOM.render(<Options />, document.getElementById('root'));
