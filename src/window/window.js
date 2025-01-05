// window.js

// Set of displayed post IDs to prevent duplicates
const displayedPostIds = new Set();

// Reference to DOM elements
const postContainer = document.getElementById('post-container');
const postTemplate = document.getElementById('post-template');
const status = document.getElementById('status');

// Function to register this window with the background script
function registerWindow() {
    chrome.runtime.sendMessage({ action: "registerWindow" }, (response) => {
        if (chrome.runtime.lastError) {
            console.error("Failed to register window:", chrome.runtime.lastError.message);
        } else {
            console.log("Window registered with background script:", response);
        }
    });
}

// Call registerWindow when the window is loaded
document.addEventListener('DOMContentLoaded', () => {
    registerWindow();
});

// Function to display status messages
function showStatus(message, type = 'success') {
    status.textContent = message;
    status.className = `status ${type}`;
    status.classList.remove('hidden');
    
    if (type === 'success') {
        setTimeout(() => {
            status.classList.add('hidden');
        }, 3000);
    }
}

// Function to display posts
function displayPosts(posts) {
    posts.forEach(post => {
        const postId = `${sanitize(post.posterName)}-${sanitize(post.postContent.substring(0, 50))}`;

        // Check if the post is already displayed
        if (displayedPostIds.has(postId)) {
            console.log(`Post "${postId}" is already displayed, skipping.`);
            return;
        }

        const postElement = document.importNode(postTemplate.content, true).firstElementChild;
        postElement.id = postId;

        postElement.querySelector('.poster-name').textContent = post.posterName;
        postElement.querySelector('.post-content').textContent = post.postContent;

        // Setup event listeners for buttons
        setupPostEventListeners(postElement, post);

        // Append the post to the container
        postContainer.appendChild(postElement);
        displayedPostIds.add(postId);
    });
}

// Function to setup event listeners for a post
function setupPostEventListeners(postElement, post) {
    const generateBtn = postElement.querySelector('.generate-comment-btn');
    const copyBtn = postElement.querySelector('.copy-comment-btn');
    const generatedComment = postElement.querySelector('.generated-comment');
    const commentContent = postElement.querySelector('.comment-content');

    if (generateBtn) {
        generateBtn.addEventListener('click', async () => {
            try {
                generateBtn.disabled = true;
                generateBtn.textContent = 'Generating...';

                // Fetch the comment from the AI (assuming you have an API endpoint)
                const comment = await generateComment(post.posterName, post.postContent);

                // Display the generated comment
                commentContent.textContent = comment;
                generatedComment.classList.remove('hidden');
                copyBtn.classList.remove('hidden');
                generateBtn.textContent = 'Generate Comment';
            } catch (error) {
                showStatus(`Error: ${error.message}`, 'error');
                console.error('Error generating comment:', error);
                generateBtn.textContent = 'Generate Comment';
            } finally {
                generateBtn.disabled = false;
            }
        });
    }

    if (copyBtn) {
        copyBtn.addEventListener('click', async () => {
            if (commentContent.textContent) {
                try {
                    await navigator.clipboard.writeText(commentContent.textContent);
                    showStatus('Comment copied to clipboard!', 'success');
                } catch (err) {
                    showStatus('Failed to copy comment.', 'error');
                    console.error('Failed to copy:', err);
                }
            }
        });
    }
}

// Function to generate a comment using AI (placeholder implementation)
async function generateComment(posterName, postContent) {
    // Replace this with your actual API call to generate a comment
    // For demonstration, we'll return a dummy comment after a delay
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(`Great post, ${posterName}! I completely agree with your insights on "${postContent}".`);
        }, 1000);
    });
}

// Function to sanitize strings for use in IDs
function sanitize(str) {
    return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

// Handle incoming messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "updateVisiblePosts") {
        const posts = request.posts;
        displayPosts(posts);
        sendResponse({ status: "success" }); // Acknowledge receipt
    }
    // If no response is needed, you can omit sendResponse
});

// Optional: Listen for theme changes
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes.theme) {
        document.body.setAttribute('data-theme', changes.theme.newValue);
    }
});

// Initialize theme based on stored settings
function initializeTheme() {
    chrome.storage.sync.get('theme', (data) => {
        if (data.theme) {
            document.body.setAttribute('data-theme', data.theme);
        }
    });
}

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
});
