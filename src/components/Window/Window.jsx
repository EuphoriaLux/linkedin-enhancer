import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { FaCopy, FaCheckCircle } from 'react-icons/fa'; // Import icons
import './Window.css';


const WindowComponent = () => {
  const params = new URLSearchParams(window.location.search);
  const comment = params.get('comment') || 'No comment generated.';
  const [copySuccess, setCopySuccess] = useState(false); // Boolean for copy status

  const handleClose = () => {
    window.close();
  };

  const handleCopy = () => {
    if (!comment) return;

    navigator.clipboard
      .writeText(comment)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 3000);
      })
      .catch((err) => {
        console.error('Failed to copy: ', err);
        alert('Failed to copy comment.');
      });
  };

  return (
    <div className="window-container">
      <h2>Generated Comment</h2>
      <div className="comment-container">{comment}</div>
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
