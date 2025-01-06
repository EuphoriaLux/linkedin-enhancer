// src/components/Window/Window.jsx

import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { FaCopy, FaCheckCircle } from 'react-icons/fa'; // Import icons
import './Window.css';

const WindowComponent = () => {
  const params = new URLSearchParams(window.location.search);
  const comment = params.get('comment') || '';
  const post = params.get('post') || '';
  const [copySuccess, setCopySuccess] = useState(false); // Boolean for copy status

  const handleClose = () => {
    window.close();
  };

  const handleCopy = () => {
    let contentToCopy = '';
    if (comment) {
      contentToCopy = comment;
    } else if (post) {
      contentToCopy = post;
    }

    if (!contentToCopy) return;

    navigator.clipboard
      .writeText(contentToCopy)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 3000);
      })
      .catch((err) => {
        console.error('Failed to copy: ', err);
        alert('Failed to copy content.');
      });
  };

  // Determine the type of content to display
  const isComment = comment !== '';
  const isPost = post !== '';

  return (
    <div className="window-container">
      <h2>{isComment ? 'Generated Comment' : isPost ? 'Generated Post' : 'Content'}</h2>
      
      <div className="content-container">
        {isComment && <div className="content">{comment}</div>}
        {isPost && <div className="content">{post}</div>}
      </div>

      <div className="button-group">
        <button onClick={handleCopy} className="button button-primary copy-button">
          {copySuccess ? (
            <>
              <FaCheckCircle className="icon success-icon" /> Copied!
            </>
          ) : (
            <>
              <FaCopy className="icon" /> Copy to Clipboard
            </>
          )}
        </button>
        <button onClick={handleClose} className="button button-secondary">
          Close
        </button>
      </div>
      
      {copySuccess && <span className="copy-feedback">Copied!</span>}
    </div>
  );
};

ReactDOM.render(<WindowComponent />, document.getElementById('root'));
