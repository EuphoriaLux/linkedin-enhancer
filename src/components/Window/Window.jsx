// src/components/Window/Window.jsx

import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { FaCopy, FaCheckCircle } from 'react-icons/fa'; // Import icons
import Menu from '../Menu/Menu'; // Import the Menu component
import 'Assets/styles/tailwind.css'; // Ensure Tailwind CSS is imported

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


    <div className="p-6 bg-white rounded-lg shadow-md max-w-md mx-auto mt-10">
            {/* Navigation Menu */}
            <Menu /> {/* Include the Menu component */}
      <h2 className="text-xl font-semibold mb-4">
        {isComment ? 'Generated Comment' : isPost ? 'Generated Post' : 'Content'}
      </h2>
      
      <div className="mb-6">
        {isComment && <div className="p-4 bg-gray-100 rounded">{comment}</div>}
        {isPost && <div className="p-4 bg-gray-100 rounded">{post}</div>}
      </div>

      <div className="flex space-x-4">
        <button
          onClick={handleCopy}
          className={`flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none transition ${
            copySuccess ? 'bg-green-500 hover:bg-green-600' : ''
          }`}
        >
          {copySuccess ? (
            <>
              <FaCheckCircle className="mr-2" /> Copied!
            </>
          ) : (
            <>
              <FaCopy className="mr-2" /> Copy to Clipboard
            </>
          )}
        </button>
        <button
          onClick={handleClose}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 focus:outline-none transition"
        >
          Close
        </button>
      </div>
      
      {copySuccess && (
        <span className="mt-4 inline-block text-green-500">Copied!</span>
      )}
    </div>
  );
};

ReactDOM.render(<WindowComponent />, document.getElementById('root'));