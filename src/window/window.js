console.log("Window script loaded");

// Theme initialization function
function initializeTheme() {
    chrome.storage.sync.get('theme', function(data) {
        if (data.theme) {
            document.body.setAttribute('data-theme', data.theme);
        }
    });
}

// Error display helper
function showError(message, duration = 5000) {
    const errorContainer = document.getElementById('error-container');
    if (!errorContainer) return;
    errorContainer.textContent = message;
    errorContainer.classList.add('show');
    setTimeout(() => errorContainer.classList.remove('show'), duration);
}

function createErrorContainer() {
    const container = document.createElement('div');
    container.id = 'error-container';
    container.className = 'error-message';
    document.body.insertBefore(container, document.body.firstChild);
    return container;
}

// Loading state management
function setLoading(isLoading, message = 'Loading posts...') {
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        if (isLoading) {
            loadingIndicator.innerHTML = `
                <div class="loading-spinner"></div>
                <span>${message}</span>
            `;
            loadingIndicator.style.display = 'flex';
        } else {
            loadingIndicator.style.display = 'none';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("Window DOM loaded");
    initializeTheme();
    setLoading(true);
});

// Listen for theme changes
chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (changes.theme) {
        document.body.setAttribute('data-theme', changes.theme.newValue);
    }
});

// Initialize debug elements
const debugInfo = {
    messageCount: document.getElementById('message-count'),
    lastMessage: document.getElementById('last-message')
};

let messageCount = 0;

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        console.log("Window received message:", request);
        
        messageCount++;
        if (debugInfo.messageCount) {
            debugInfo.messageCount.textContent = `Messages received: ${messageCount}`;
        }
        if (debugInfo.lastMessage) {
            debugInfo.lastMessage.textContent = `Last message: ${JSON.stringify(request)}`;
        }

        if (request.action === "setPostContent") {
            setLoading(false);

            if (request.debug) {
                showDebugInfo(request.debug);
            }

            if (!request.postContent || !Array.isArray(request.postContent) || request.postContent.length === 0) {
                console.log("No posts received in message");
                showError("No posts found. Try refreshing the LinkedIn page.");
                sendResponse({ status: "no_posts" });
                return false;
            }

            try {
                displayPosts(request.postContent);
                sendResponse({ status: "success" });
            } catch (error) {
                console.error("Error displaying posts:", error);
                showError(`Error displaying posts: ${error.message}`);
                sendResponse({ status: "error", message: error.message });
            }
        }

        return false;
    }
);

async function displayPosts(posts) {
    console.log("Displaying posts:", posts);
    
    const postContainer = document.getElementById('post-container');
    const postTemplate = document.getElementById('post-template');
    
    if (!postContainer || !postTemplate) {
        throw new Error("Required elements not found in the DOM");
    }

    if (!Array.isArray(posts) || posts.length === 0) {
        throw new Error("No valid posts to display");
    }

    postContainer.innerHTML = '';
    setLoading(false);

    const fragment = document.createDocumentFragment();

    for (const [index, post] of posts.entries()) {
        try {
            const postElement = document.importNode(postTemplate.content, true);
            
            const cleanName = post.posterName.split('\n')[0].trim();
            
            postElement.querySelector('.poster-name').textContent = cleanName;
            postElement.querySelector('.post-content').textContent = post.postContent;
            
            const generateBtn = postElement.querySelector('.generate-comment-btn');
            const generatedComment = postElement.querySelector('.generated-comment');
            const promptDisplay = postElement.querySelector('.prompt-display');
            const commentContent = postElement.querySelector('.comment-content');
            const copyBtn = postElement.querySelector('.copy-comment-btn');
            const promptTextElement = postElement.querySelector('.prompt-text');
            
            if (generateBtn) {
                generateBtn.addEventListener('click', async () => {
                    try {
                        generateBtn.disabled = true;
                        generateBtn.textContent = 'Generating...';
                        
                        const settings = await chrome.storage.sync.get(['defaultPrompt']);
                        const prompt = settings.defaultPrompt
                            ? settings.defaultPrompt
                                .replace('{content}', post.postContent)
                                .replace('{name}', cleanName)
                            : `Generate a professional comment for LinkedIn post by ${cleanName}: "${post.postContent}"`;

                        generatedComment.classList.remove('hidden');
                        promptDisplay.classList.remove('hidden');
                        commentContent.textContent = 'Generating comment...';
                        
                        const generatedText = await APIService.generateComment(
                            post.postContent,
                            cleanName
                        );
                        
                        promptTextElement.textContent = prompt;
                        commentContent.textContent = generatedText;
                    } catch (error) {
                        showError(error.message);
                        commentContent.textContent = `Error: ${error.message}`;
                    } finally {
                        generateBtn.disabled = false;
                        generateBtn.textContent = 'Generate Comment';
                    }
                });
            }
            
            if (copyBtn) {
                copyBtn.addEventListener('click', async () => {
                    if (commentContent.textContent) {
                        try {
                            await navigator.clipboard.writeText(commentContent.textContent);
                            copyBtn.textContent = 'Copied!';
                            setTimeout(() => {
                                copyBtn.textContent = 'Copy';
                            }, 2000);
                        } catch (err) {
                            showError('Failed to copy to clipboard');
                            console.error('Failed to copy:', err);
                        }
                    }
                });
            }
            
            fragment.appendChild(postElement);
            console.log(`Successfully added post ${index + 1}`);
        } catch (error) {
            console.error(`Error displaying post ${index}:`, error);
            showError(`Error displaying post ${index + 1}`);
        }
    }

    postContainer.appendChild(fragment);
}

function showDebugInfo(debugData) {
    const debugContainer = document.getElementById('debug-info');
    if (debugData && debugContainer) {
        debugContainer.innerHTML = `
            <div>Debug Information:</div>
            <div>Total Posts Found: ${debugData.totalPostsFound || 0}</div>
            <div>Timestamp: ${debugData.timestamp || 'N/A'}</div>
            ${debugData.errorStack ? `<div>Error: ${debugData.errorStack}</div>` : ''}
        `;
    }
}
