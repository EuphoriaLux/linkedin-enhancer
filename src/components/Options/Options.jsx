// src/components/Options/Options.jsx

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import './Options.css';

const PLACEHOLDER_FEED_IMAGE = 'https://via.placeholder.com/50?text=Feed';

const Options = () => {
  // State variables for AI Configuration
  const [aiModel, setAiModel] = useState('gemini-pro');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(150);

  // State variables for Comment Generation
  const [defaultPrompt, setDefaultPrompt] = useState('');
  const [promptStyle, setPromptStyle] = useState('professional-formal');
  const [blacklist, setBlacklist] = useState('');

  // State variables for Display Settings
  const [theme, setTheme] = useState('light');
  const [fontSize, setFontSize] = useState('medium');
  const [maxPosts, setMaxPosts] = useState(10);

  // State variables for Advanced Settings
  const [debugMode, setDebugMode] = useState(false);
  const [autoExpand, setAutoExpand] = useState(false);
  const [customCSS, setCustomCSS] = useState('');

  // State for general settings status messages
  const [status, setStatus] = useState({ message: '', type: '' });

  // Load settings from chrome.storage on component mount
  useEffect(() => {
    chrome.storage.sync.get(
      [
        'aiModel',
        'temperature',
        'maxTokens',
        'defaultPrompt',
        'promptStyle',
        'blacklist',
        'theme',
        'fontSize',
        'maxPosts',
        'debugMode',
        'autoExpand',
        'customCSS',
      ],
      (result) => {
        // AI Configuration
        if (result.aiModel) {
          setAiModel(result.aiModel);
          console.log('Loaded AI Model:', result.aiModel);
        }
        if (result.temperature !== undefined) {
          setTemperature(result.temperature);
          console.log('Loaded Temperature:', result.temperature);
        }
        if (result.maxTokens) {
          setMaxTokens(result.maxTokens);
          console.log('Loaded Max Tokens:', result.maxTokens);
        }

        // Comment Generation
        if (result.defaultPrompt) {
          setDefaultPrompt(result.defaultPrompt);
          console.log('Loaded Default Prompt:', result.defaultPrompt);
        }
        if (result.promptStyle) {
          setPromptStyle(result.promptStyle);
          console.log('Loaded Prompt Style:', result.promptStyle);
        }
        if (result.blacklist) {
          setBlacklist(result.blacklist);
          console.log('Loaded Blacklist:', result.blacklist);
        }

        // Display Settings
        if (result.theme) {
          setTheme(result.theme);
          console.log('Loaded Theme:', result.theme);
        }
        if (result.fontSize) {
          setFontSize(result.fontSize);
          console.log('Loaded Font Size:', result.fontSize);
        }
        if (result.maxPosts) {
          setMaxPosts(result.maxPosts);
          console.log('Loaded Max Posts:', result.maxPosts);
        }

        // Advanced Settings
        if (result.debugMode !== undefined) {
          setDebugMode(result.debugMode);
          console.log('Loaded Debug Mode:', result.debugMode);
        }
        if (result.autoExpand !== undefined) {
          setAutoExpand(result.autoExpand);
          console.log('Loaded Auto Expand:', result.autoExpand);
        }
        if (result.customCSS) {
          setCustomCSS(result.customCSS);
          console.log('Loaded Custom CSS:', result.customCSS);
        }
      }
    );
  }, []);

  // Handle form submission for general settings
  const handleSubmit = (e) => {
    e.preventDefault();
    // Prepare settings object
    const settings = {
      aiModel,
      temperature,
      maxTokens,
      defaultPrompt,
      promptStyle,
      blacklist,
      theme,
      fontSize,
      maxPosts,
      debugMode,
      autoExpand,
      customCSS,
    };

    // Save settings to chrome.storage
    chrome.storage.sync.set(settings, () => {
      setStatus({ message: 'Settings saved successfully!', type: 'success' });
      console.log('Settings Saved:', settings);
      // Optionally, clear the status message after a few seconds
      setTimeout(() => setStatus({ message: '', type: '' }), 3000);
    });
  };

  return (
    <div className="options-container">
      <h1>LinkedIn Enhancer Settings</h1>
      <form onSubmit={handleSubmit}>
        {/* AI Configuration Section */}
        <div className="section">
          <h3>AI Configuration</h3>
          <div className="form-group">
            <label htmlFor="aiModel">AI Model:</label>
            <select
              id="aiModel"
              value={aiModel}
              onChange={(e) => setAiModel(e.target.value)}
              title="Select the AI model for comment generation"
            >
              <option value="gemini-pro">Gemini Pro</option>
              <option value="gemini-pro-vision">Gemini Pro Vision</option>
            </select>
            <small>Select the AI model for comment generation</small>
          </div>

          <div className="form-group">
            <label htmlFor="temperature">Creativity Level:</label>
            <div className="range-container" title="Higher values generate more creative, varied responses">
              <input
                type="range"
                id="temperature"
                min="0"
                max="1"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
              />
              <span className="range-value">{temperature}</span>
            </div>
            <small>Higher values generate more creative, varied responses</small>
          </div>

          <div className="form-group">
            <label htmlFor="maxTokens">Maximum Comment Length:</label>
            <div className="range-container" title="Maximum length of generated comments (in tokens)">
              <input
                type="range"
                id="maxTokens"
                min="50"
                max="500"
                step="50"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value))}
              />
              <span className="range-value">{maxTokens}</span>
            </div>
            <small>Maximum length of generated comments (in tokens)</small>
          </div>
        </div>

        {/* Comment Generation Section */}
        <div className="section">
          <h3>Comment Generation</h3>
          <div className="form-group">
            <label htmlFor="defaultPrompt">Default Comment Prompt:</label>
            <textarea
              id="defaultPrompt"
              rows="4"
              value={defaultPrompt}
              onChange={(e) => setDefaultPrompt(e.target.value)}
              placeholder="Enter your default prompt template. Use {content} for post content and {name} for poster name."
            ></textarea>
            <small>
              Customize the base prompt for generating comments. Use <code>{'{content}'}</code> and{' '}
              <code>{'{name}'}</code> placeholders.
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="promptStyle">Prompt Style:</label>
            <select
              id="promptStyle"
              value={promptStyle}
              onChange={(e) => setPromptStyle(e.target.value)}
              title="Choose a pre-defined style for your comments"
            >
              <option value="professional-formal">Professional &amp; Formal</option>
              <option value="interactive-engaging">Interactive &amp; Engaging</option>
              <option value="analytical-thoughtful">Analytical &amp; Thoughtful</option>
              <option value="supportive-encouraging">Supportive &amp; Encouraging</option>
            </select>
            <small>Choose a pre-defined style for your comments</small>
          </div>

          <div className="form-group">
            <label htmlFor="blacklist">Blocked Words/Phrases:</label>
            <textarea
              id="blacklist"
              rows="3"
              value={blacklist}
              onChange={(e) => setBlacklist(e.target.value)}
              placeholder="Enter words or phrases to avoid in comments (one per line)"
            ></textarea>
            <small>These words/phrases will be avoided in generated comments</small>
          </div>
        </div>

        {/* Display Settings Section */}
        <div className="section">
          <h3>Display Settings</h3>
          <div className="form-group">
            <label htmlFor="theme">Theme:</label>
            <select
              id="theme"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              title="Select the color theme for the extension"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System Default</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="fontSize">Font Size:</label>
            <select
              id="fontSize"
              value={fontSize}
              onChange={(e) => setFontSize(e.target.value)}
              title="Adjust the font size in the extension's UI"
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="maxPosts">Maximum Posts Displayed:</label>
            <input
              type="number"
              id="maxPosts"
              min="1"
              max="50"
              value={maxPosts}
              onChange={(e) => setMaxPosts(parseInt(e.target.value))}
              title="Maximum number of posts to show in the popup window"
            />
            <small>Maximum number of posts to show in the popup window</small>
          </div>
        </div>

        {/* Advanced Settings Section */}
        <div className="section">
          <h3>Advanced Settings</h3>
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                id="debugMode"
                checked={debugMode}
                onChange={(e) => setDebugMode(e.target.checked)}
                title="Show additional debugging information in the console"
              />
              Enable Debug Mode
            </label>
            <small>Show additional debugging information in the console</small>
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                id="autoExpand"
                checked={autoExpand}
                onChange={(e) => setAutoExpand(e.target.checked)}
                title="Automatically expand the comment section after generation"
              />
              Auto-expand Comment Section
            </label>
            <small>Automatically expand the comment section after generation</small>
          </div>

          <div className="form-group">
            <label htmlFor="customCSS">Custom CSS:</label>
            <textarea
              id="customCSS"
              rows="4"
              value={customCSS}
              onChange={(e) => setCustomCSS(e.target.value)}
              placeholder="Enter custom CSS rules"
            ></textarea>
            <small>Advanced: Add custom CSS styles to modify the extension's appearance</small>
          </div>
        </div>

        {/* Link to RSS Feed Management */}
        <div className="section">
          <h3>RSS Feed Management</h3>
          <p>
            Manage your RSS feeds separately in the{' '}
            <a href="rssfeed.html" target="_blank" rel="noopener noreferrer">
              RSS Feed Settings
            </a>{' '}
            page.
          </p>
        </div>

        {/* Submit Button for General Settings */}
        <button type="submit" className="button button-primary">
          Save Settings
        </button>
      </form>

      {/* Status Message for General Settings */}
      {status.message && (
        <div className={`status ${status.type}`}>
          {status.message}
        </div>
      )}
    </div>
  );
};

ReactDOM.render(<Options />, document.getElementById('root'));
