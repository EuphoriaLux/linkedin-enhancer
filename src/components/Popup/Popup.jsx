// src/components/Popup/Popup.jsx

import React from 'react';
import ReactDOM from 'react-dom';
import './Popup.css';

const Popup = () => {
  const openContentGenerator = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('content_generator.html') });
  };

  const openOptions = () => {
    chrome.runtime.openOptionsPage();
  };

  const openRSSFeedSettings = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('rssfeed.html') });
  };

  return (
    <div className="popup-container">
      <h1>LinkedIn Comment Generator</h1>
      <div className="button-group">
        <button onClick={openContentGenerator} className="button">
          Open Content Generator
        </button>
        <button onClick={openOptions} className="button">
          Options
        </button>
        <button onClick={openRSSFeedSettings} className="button">
          RSS Feed Settings
        </button>
      </div>
    </div>
  );
};

ReactDOM.render(<Popup />, document.getElementById('root'));
