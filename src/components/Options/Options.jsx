// src/components/Options/Options.jsx

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { FaSave, FaExclamationCircle, FaCheckCircle, FaSpinner, FaUndo } from 'react-icons/fa';
import Menu from '../Menu/Menu'; // Import the Menu component
import classNames from 'classnames';
import 'Assets/styles/tailwind.css'; // Ensure Tailwind CSS is imported
import LoginButton from '../Login/LoginButton'; // Adjust the path if necessary
import ConnectionsList from '../Login/ConnectionsList'; // Adjust the path if necessary
import LogoutButton from '../Login/LogoutButton'; // Optional: Implement Logout functionality

const StatusMessage = ({ message, type }) => {
  if (!message) return null;

  const icon = {
    success: <FaCheckCircle className="mr-2 text-green-500" />,
    error: <FaExclamationCircle className="mr-2 text-red-500" />,
    info: <FaExclamationCircle className="mr-2 text-blue-500" />,
    warning: <FaExclamationCircle className="mr-2 text-yellow-500" />,
  };

  return (
    <div
      className={classNames(
        'mb-6 p-4 rounded flex items-center',
        {
          'bg-green-100 text-green-800': type === 'success',
          'bg-red-100 text-red-800': type === 'error',
          'bg-blue-100 text-blue-800': type === 'info',
          'bg-yellow-100 text-yellow-800': type === 'warning',
        }
      )}
      aria-live="polite"
    >
      {icon[type]}
      <span>{message}</span>
    </div>
  );
};

const ApiRequestConfig = ({
  title,
  prompt,
  setPrompt,
  aiModel,
  setAiModel,
  customAiModel,
  setCustomAiModel,
  temperature,
  setTemperature,
  maxTokens,
  setMaxTokens,
  errors,
  availablePlaceholders,
}) => {
  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">{title}</h2>
      
      {/* Prompt Section */}
      <div className="mb-4">
        <label htmlFor={`${title}-prompt`} className="block text-gray-700 font-medium mb-2">
          Prompt:
        </label>
        <textarea
          id={`${title}-prompt`}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={`Enter your default prompt for ${title.toLowerCase()}...`}
          rows="4"
          className={classNames(
            "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
            { 'border-red-500': errors.prompt }
          )}
          aria-describedby={`${title}-prompt-error`}
        ></textarea>
        {errors.prompt && (
          <small id={`${title}-prompt-error`} className="text-red-500 mt-1 block">
            {errors.prompt}
          </small>
        )}
        <small className="text-gray-500 mt-1 block">
          Customize the default prompt used for generating {title.toLowerCase()}. Use placeholders like{' '}
          {availablePlaceholders.map((ph, index) => (
            <span key={index}>
              <code className="bg-gray-200 px-1 rounded">{`{${ph}}`}</code>
              {index < availablePlaceholders.length - 1 ? ', ' : '.'}
            </span>
          ))}
        </small>
      </div>
      
      {/* AI Model Selection */}
      <div className="mb-4">
        <label htmlFor={`${title}-ai-model`} className="block text-gray-700 font-medium mb-2">
          AI Model:
        </label>
        <select
          id={`${title}-ai-model`}
          value={aiModel}
          onChange={(e) => setAiModel(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="gemini-pro">Gemini Pro</option>
          <option value="gemini-basic">Gemini Basic</option>
          <option value="custom">Custom</option>
        </select>
      </div>
      
      {/* Custom Model Input */}
      {aiModel === 'custom' && (
        <div className="mb-4">
          <label htmlFor={`${title}-custom-ai-model`} className="block text-gray-700 font-medium mb-2">
            Custom Model Identifier:
          </label>
          <input
            id={`${title}-custom-ai-model`}
            type="text"
            value={customAiModel}
            onChange={(e) => setCustomAiModel(e.target.value)}
            placeholder="Enter custom model identifier"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          {errors.commentCustomModel && (
            <small id={`${title}-custom-ai-model-error`} className="text-red-500 mt-1 block">
              {errors.commentCustomModel}
            </small>
          )}
        </div>
      )}
      
      {/* Temperature Input */}
      <div className="mb-4">
        <label htmlFor={`${title}-temperature`} className="block text-gray-700 font-medium mb-2">
          Temperature:
        </label>
        <input
          id={`${title}-temperature`}
          type="number"
          value={temperature}
          onChange={(e) => setTemperature(e.target.value)}
          step="0.1"
          min="0"
          max="1"
          className={classNames(
            "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
            { 'border-red-500': errors.temperature }
          )}
          aria-describedby={`${title}-temperature-error`}
        />
        {errors.temperature && (
          <small id={`${title}-temperature-error`} className="text-red-500 mt-1 block">
            {errors.temperature}
          </small>
        )}
      </div>
      
      {/* Max Tokens Input */}
      <div>
        <label htmlFor={`${title}-max-tokens`} className="block text-gray-700 font-medium mb-2">
          Max Tokens:
        </label>
        <input
          id={`${title}-max-tokens`}
          type="number"
          value={maxTokens}
          onChange={(e) => setMaxTokens(e.target.value)}
          min="50"
          max="1000"
          className={classNames(
            "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
            { 'border-red-500': errors.maxTokens }
          )}
          aria-describedby={`${title}-max-tokens-error`}
        />
        {errors.maxTokens && (
          <small id={`${title}-max-tokens-error`} className="text-red-500 mt-1 block">
            {errors.maxTokens}
          </small>
        )}
      </div>
    </div>
  );
};

const Options = () => {
  const [apiKey, setApiKey] = useState('');
  const [defaultCommentPrompt, setDefaultCommentPrompt] = useState('');
  const [defaultPostPrompt, setDefaultPostPrompt] = useState('');
  const [commentAiModel, setCommentAiModel] = useState('gemini-pro');
  const [commentCustomModel, setCommentCustomModel] = useState('');
  const [commentTemperature, setCommentTemperature] = useState(0.7);
  const [commentMaxTokens, setCommentMaxTokens] = useState(150);
  const [postAiModel, setPostAiModel] = useState('gemini-pro');
  const [postCustomModel, setPostCustomModel] = useState('');
  const [postTemperature, setPostTemperature] = useState(0.7);
  const [postMaxTokens, setPostMaxTokens] = useState(150);
  const [blacklist, setBlacklist] = useState('');
  const [status, setStatus] = useState({ message: '', type: '' });
  const [isSaving, setIsSaving] = useState(false);

  // Form validation errors
  const [errors, setErrors] = useState({
    apiKey: '',
    defaultCommentPrompt: '',
    defaultPostPrompt: '',
    commentTemperature: '',
    commentMaxTokens: '',
    postTemperature: '',
    postMaxTokens: '',
    commentCustomModel: '',
    postCustomModel: '',
  });

  // LinkedIn authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Load settings and authentication state from chrome.storage.sync on component mount
  useEffect(() => {
    chrome.storage.sync.get(
      [
        'apiKey',
        'defaultCommentPrompt',
        'defaultPostPrompt',
        'commentAiModel',
        'commentCustomModel',
        'postAiModel',
        'postCustomModel',
        'commentTemperature',
        'commentMaxTokens',
        'postTemperature',
        'postMaxTokens',
        'blacklist',
      ],
      (result) => {
        setApiKey(result.apiKey || '');
        // Prefill with variable-enhanced default prompts if not set
        setDefaultCommentPrompt(result.defaultCommentPrompt || 'Great insight, {posterName}! I enjoyed reading your thoughts on {postContent}.');
        setDefaultPostPrompt(result.defaultPostPrompt || 'New update: {articleContent}. Learn more at {websiteURL} and follow {feedName} for updates.');
        setCommentAiModel(result.commentAiModel || 'gemini-pro');
        setCommentCustomModel(result.commentCustomModel || '');
        setCommentTemperature(result.commentTemperature !== undefined ? result.commentTemperature : 0.7);
        setCommentMaxTokens(result.commentMaxTokens !== undefined ? result.commentMaxTokens : 150);
        setPostAiModel(result.postAiModel || 'gemini-pro');
        setPostCustomModel(result.postCustomModel || '');
        setPostTemperature(result.postTemperature !== undefined ? result.postTemperature : 0.7);
        setPostMaxTokens(result.postMaxTokens !== undefined ? result.postMaxTokens : 150);
        setBlacklist(result.blacklist || '');
      }
    );

    // Check LinkedIn authentication state
    chrome.storage.local.get(['linkedinAccessToken'], (result) => {
      if (result.linkedinAccessToken) {
        setIsLoggedIn(true);
      }
    });
  }, []);

  const validateForm = () => {
    const newErrors = {};

    if (!apiKey.trim()) {
      newErrors.apiKey = 'API key cannot be empty.';
    }

    if (!defaultCommentPrompt.trim()) {
      newErrors.defaultCommentPrompt = 'Default comment prompt cannot be empty.';
    }

    if (!defaultPostPrompt.trim()) {
      newErrors.defaultPostPrompt = 'Default post prompt cannot be empty.';
    }

    if (commentTemperature < 0 || commentTemperature > 1) {
      newErrors.commentTemperature = 'Temperature must be between 0 and 1.';
    }

    if (postTemperature < 0 || postTemperature > 1) {
      newErrors.postTemperature = 'Temperature must be between 0 and 1.';
    }

    if (commentMaxTokens < 50 || commentMaxTokens > 1000) {
      newErrors.commentMaxTokens = 'Max Tokens must be between 50 and 1000.';
    }

    if (postMaxTokens < 50 || postMaxTokens > 1000) {
      newErrors.postMaxTokens = 'Max Tokens must be between 50 and 1000.';
    }

    // NEW: Validate custom model fields
    if (commentAiModel === 'custom' && !commentCustomModel.trim()) {
      newErrors.commentCustomModel = "Custom model not specified in settings.";
    }
    if (postAiModel === 'custom' && !postCustomModel.trim()) {
      newErrors.postCustomModel = "Custom model not specified in settings.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const saveSettings = () => {
    if (!validateForm()) {
      setStatus({ message: 'Please fix the errors in the form.', type: 'error' });
      return;
    }

    setIsSaving(true);
    setStatus({ message: '', type: '' });

    chrome.storage.sync.set(
      {
        apiKey: apiKey.trim(),
        defaultCommentPrompt: defaultCommentPrompt.trim(),
        defaultPostPrompt: defaultPostPrompt.trim(),
        commentAiModel: commentAiModel.trim(),
        commentCustomModel: commentCustomModel.trim(),
        commentTemperature: parseFloat(commentTemperature),
        commentMaxTokens: parseInt(commentMaxTokens, 10),
        postAiModel: postAiModel.trim(),
        postCustomModel: postCustomModel.trim(),
        postTemperature: parseFloat(postTemperature),
        postMaxTokens: parseInt(postMaxTokens, 10),
        blacklist: blacklist.trim(),
      },
      () => {
        setIsSaving(false);
        if (chrome.runtime.lastError) {
          setStatus({ message: `Error saving settings: ${chrome.runtime.lastError.message}`, type: 'error' });
        } else {
          setStatus({ message: 'Settings saved successfully!', type: 'success' });
        }
      }
    );
  };

  const resetToDefaults = () => {
    const defaultSettings = {
      apiKey: '',
      // Updated default Comment prompt with variables
      defaultCommentPrompt: 'Great insight, {posterName}! I enjoyed reading your thoughts on {postContent}.',
      // Updated default Post prompt with variables
      defaultPostPrompt: 'New update: {articleContent}. Learn more at {websiteURL} and follow {feedName} for updates.',
      commentAiModel: 'gemini-pro',
      commentCustomModel: '',
      commentTemperature: 0.7,
      commentMaxTokens: 150,
      postAiModel: 'gemini-pro',
      postCustomModel: '',
      postTemperature: 0.7,
      postMaxTokens: 150,
      blacklist: '',
    };

    setApiKey(defaultSettings.apiKey);
    setDefaultCommentPrompt(defaultSettings.defaultCommentPrompt);
    setDefaultPostPrompt(defaultSettings.defaultPostPrompt);
    setCommentAiModel(defaultSettings.commentAiModel);
    setCommentCustomModel(defaultSettings.commentCustomModel);
    setCommentTemperature(defaultSettings.commentTemperature);
    setCommentMaxTokens(defaultSettings.commentMaxTokens);
    setPostAiModel(defaultSettings.postAiModel);
    setPostCustomModel(defaultSettings.postCustomModel);
    setPostTemperature(defaultSettings.postTemperature);
    setPostMaxTokens(defaultSettings.postMaxTokens);
    setBlacklist(defaultSettings.blacklist);
    setErrors({});
    setStatus({ message: 'Settings reset to default values.', type: 'info' });
  };

  const handleLogout = () => {
    chrome.storage.local.remove(['linkedinAccessToken'], () => {
      setIsLoggedIn(false);
      setStatus({ message: 'Logged out from LinkedIn.', type: 'info' });
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-100 min-h-screen">

      {/* Navigation Menu */}
      <Menu /> {/* Include the Menu component */}

      {/* Header */}
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Extension Options</h1>

      {/* Status Message */}
      <StatusMessage message={status.message} type={status.type} />

      {/* API Key Section */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <label htmlFor="apiKey" className="block text-gray-700 font-medium mb-2">
          Google AI API Key:
        </label>
        <input
          id="apiKey"
          type="text"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Enter your API key..."
          className={classNames(
            "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
            { 'border-red-500': errors.apiKey }
          )}
          aria-describedby="apiKey-error"
        />
        {errors.apiKey && (
          <small id="apiKey-error" className="text-red-500 mt-1 block">
            {errors.apiKey}
          </small>
        )}
      </div>

      {/* Comment Configuration */}
      <ApiRequestConfig
        title="Comment Configuration"
        prompt={defaultCommentPrompt}
        setPrompt={setDefaultCommentPrompt}
        aiModel={commentAiModel}
        setAiModel={setCommentAiModel}
        customAiModel={commentCustomModel}
        setCustomAiModel={setCommentCustomModel}
        temperature={commentTemperature}
        setTemperature={setCommentTemperature}
        maxTokens={commentMaxTokens}
        setMaxTokens={setCommentMaxTokens}
        errors={{
          prompt: errors.defaultCommentPrompt,
          temperature: errors.commentTemperature,
          maxTokens: errors.commentMaxTokens,
          commentCustomModel: errors.commentCustomModel,
        }}
        availablePlaceholders={['postContent', 'posterName']}
      />

      {/* Post Configuration */}
      <ApiRequestConfig
        title="Post Configuration"
        prompt={defaultPostPrompt}
        setPrompt={setDefaultPostPrompt}
        aiModel={postAiModel}
        setAiModel={setPostAiModel}
        customAiModel={postCustomModel}
        setCustomAiModel={setPostCustomModel}
        temperature={postTemperature}
        setTemperature={setPostTemperature}
        maxTokens={postMaxTokens}
        setMaxTokens={setPostMaxTokens}
        errors={{
          prompt: errors.defaultPostPrompt,
          temperature: errors.postTemperature,
          maxTokens: errors.postMaxTokens,
          postCustomModel: errors.postCustomModel,
        }}
        availablePlaceholders={['articleContent', 'feedName', 'websiteURL', 'websiteContent']}
      />

      {/* LinkedIn Integration Section */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">LinkedIn Integration</h2>
        {!isLoggedIn ? (
          <LoginButton onLoginSuccess={() => setIsLoggedIn(true)} />
        ) : (
          <div className="mt-4">
            <p className="text-green-600 mb-2">Connected to LinkedIn successfully!</p>
            <ConnectionsList />
            <LogoutButton onLogout={handleLogout} />
          </div>
        )}
      </div>

      {/* Blacklist Section */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <label htmlFor="blacklist" className="block text-gray-700 font-medium mb-2">
          Blacklist:
        </label>
        <textarea
          id="blacklist"
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

      {/* Save and Reset Buttons */}
      <div className="flex items-center space-x-4">
        <button
          onClick={saveSettings}
          className={classNames(
            "flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover transition duration-200",
            { 'opacity-50 cursor-not-allowed': isSaving }
          )}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <FaSpinner className="mr-2 animate-spin" /> Saving...
            </>
          ) : (
            <>
              <FaSave className="mr-2" /> Save Settings
            </>
          )}
        </button>
        <button
          onClick={resetToDefaults}
          className="flex items-center px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition duration-200"
          aria-label="Reset settings to default values"
        >
          <FaUndo className="mr-2" /> Reset to Defaults
        </button>
      </div>
    </div>
  );
};

ReactDOM.render(<Options />, document.getElementById('root'));
