// content_scripts/content.js

(function() {
    if (window.linkedInEnhancerInitialized) {
        console.log("LinkedIn Comment Generator already initialized.");
        return;
    }

    window.linkedInEnhancerInitialized = true;

    const DEBUG = true;

    function debugLog(...args) {
        if (DEBUG) {
            console.log(...args);
        }
    }

    function debugError(...args) {
        if (DEBUG) {
            console.error(...args);
        }
    }

    // Function to inject buttons into posts
    function injectButtons() {
        // Define selectors to identify post containers
        const postSelectors = [
            'div.occludable-update'       // Outermost LinkedIn post container
            // Removed 'div.feed-shared-update-v2' to prevent duplicate injections
        ];

        postSelectors.forEach(selector => {
            const posts = document.querySelectorAll(selector);
            posts.forEach(post => {
                const postId = post.getAttribute('data-urn') || 'unknown-post';
                debugLog(`Processing Post ID: ${postId}`);

                // Avoid injecting multiple buttons by checking a data attribute
                if (post.getAttribute('data-comment-button-injected') === 'true') {
                    debugLog(`Post ID: ${postId} already has a Generate Comment button.`);
                    return;
                }

                // Create the button
                const button = document.createElement('button');
                button.innerText = 'Generate Comment';
                button.className = 'generate-comment-btn';
                // Apply styles via CSS classes instead of inline styles for better maintainability
                button.style.marginTop = '10px';
                button.style.padding = '5px 10px';
                button.style.backgroundColor = '#0073b1';
                button.style.color = '#fff';
                button.style.border = 'none';
                button.style.borderRadius = '4px';
                button.style.cursor = 'pointer';

                // Append the button to the post
                post.appendChild(button);

                // Add click event listener
                button.addEventListener('click', () => {
                    handleGenerateComment(post);
                });

                // Mark this post as having the button injected
                post.setAttribute('data-comment-button-injected', 'true');

                debugLog(`Injected Generate Comment button into Post ID: ${postId}`);
            });
        });
    }

    // Function to handle button clicks
    function handleGenerateComment(post) {
        // Extract post identifier or content if needed
        const postId = post.getAttribute('data-urn') || 'unknown-post';

        // Adjust these selectors as per your inspection
        const postContentElement = post.querySelector('div.feed-shared-update-v2__description-wrapper, div.ember-view span.break-words');
        const postContent = postContentElement ? postContentElement.innerText.trim() : 'No content available';

        // Extract poster's name
        const posterNameElement = post.querySelector('span.feed-shared-actor__name, a.feed-shared-actor__name-link, span.actor-name');
        const posterName = posterNameElement ? posterNameElement.innerText.trim() : 'Unknown User';

        debugLog(`Generate Comment clicked for Post ID: ${postId}, Poster: ${posterName}`);
        debugLog(`Post Content: ${postContent}`);

        // Disable the button to prevent multiple clicks
        const button = post.querySelector('.generate-comment-btn');
        if (button) {
            button.disabled = true;
            button.innerText = 'Generating...';
        }

        // Send message to background script to generate comment
        chrome.runtime.sendMessage({
            action: 'generateComment',
            postId: postId,
            postContent: postContent,
            posterName: posterName
        }, (response) => {
            // Re-enable the button
            if (button) {
                button.disabled = false;
                button.innerText = 'Generate Comment';
            }

            if (chrome.runtime.lastError) {
                debugError('Runtime error:', chrome.runtime.lastError);
                alert('Failed to generate comment. Please try again.');
                return;
            }

            if (response && response.comment) {
                debugLog('Received generated comment:', response.comment);
                // Open a new window to display the comment
                openCommentWindow(response.comment);
            } else if (response && response.error) {
                debugError('Error generating comment:', response.error);
                alert(response.error);
            } else {
                debugError('No comment received in response.');
                alert('Failed to generate comment. Please try again.');
            }
        });
    }

    function openCommentWindow(comment) {
        const width = 600; // Increased width
        const height = 400; // Increased height
        const left = (screen.width / 2) - (width / 2);
        const top = (screen.height / 2) - (height / 2);
    
        // Encode the comment to include in URL
        const encodedComment = encodeURIComponent(comment);
        const windowURL = chrome.runtime.getURL(`window.html?comment=${encodedComment}`); // Ensure the path is correct
    
        // Create the window
        const commentWindow = window.open(
            windowURL,
            `CommentWindow_${Date.now()}`,
            `width=${width},height=${height},top=${top},left=${left}`
        );
    
        if (!commentWindow) {
            alert('Failed to open comment window. Please allow popups for this site.');
        }
    }
    


    // Function to sanitize HTML to prevent XSS
    function sanitizeHTML(str) {
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    }

    // Setup MutationObserver to handle dynamically loaded posts
    function setupMutationObserver() {
        const targetNode = document.body;
        const config = { childList: true, subtree: true };

        // Debounce the injectButtons function to prevent rapid, repeated calls
        function debounce(func, wait) {
            let timeout;
            return function(...args) {
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(this, args), wait);
            };
        }

        const debouncedInjectButtons = debounce(injectButtons, 500);

        const callback = function(mutationsList) {
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    debouncedInjectButtons(); // Use the debounced function
                }
            }
        };

        const observer = new MutationObserver(callback);
        observer.observe(targetNode, config);

        debugLog('MutationObserver set up successfully.');
    }

    // Initial injection of buttons
    injectButtons();

    // Set up MutationObserver for dynamic content
    setupMutationObserver();

})();
