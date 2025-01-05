console.log("Window script loaded");

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

let windowState = {
    isMaximized: false,
    defaultWidth: 0,
    defaultHeight: 0,
    defaultLeft: 0,
    defaultTop: 0
};

function initializeWindowState() {
    chrome.windows.getCurrent((window) => {
        windowState.defaultWidth = window.width;
        windowState.defaultHeight = window.height;
        windowState.defaultLeft = window.left;
        windowState.defaultTop = window.top;
    });
}

function setupWindowResizeHandler() {
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            chrome.storage.local.set({
                windowSize: {
                    width: window.outerWidth,
                    height: window.outerHeight,
                    left: window.screenX,
                    top: window.screenY
                }
            });
        }, 500);
    });
}

function setupWindowControls() {
    const togglePinBtn = document.getElementById('togglePin');
    const toggleSizeBtn = document.getElementById('toggleSize');

    if (togglePinBtn) {
        togglePinBtn.addEventListener('click', () => {
            chrome.windows.getCurrent((window) => {
                const isPinned = togglePinBtn.classList.toggle('active');
                chrome.windows.update(window.id, {
                    focused: true,
                    state: 'normal',
                    alwaysOnTop: isPinned
                });
                chrome.storage.local.set({ windowPinned: isPinned });
            });
        });
    }

    if (toggleSizeBtn) {
        toggleSizeBtn.addEventListener('click', () => {
            chrome.windows.getCurrent((window) => {
                if (windowState.isMaximized) {
                    // Restore to previous size
                    chrome.windows.update(window.id, {
                        state: 'normal',
                        width: windowState.defaultWidth,
                        height: windowState.defaultHeight,
                        left: windowState.defaultLeft,
                        top: windowState.defaultTop
                    });
                } else {
                    // Maximize
                    chrome.windows.update(window.id, {
                        state: 'maximized'
                    });
                }
                windowState.isMaximized = !windowState.isMaximized;
                toggleSizeBtn.classList.toggle('active');
            });
        });
    }
}

let currentPosts = new Map();

function setupPostEventListeners(postElement, post) {
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
                        .replace('{name}', post.posterName)
                    : `Generate a professional comment for LinkedIn post by ${post.posterName}: "${post.postContent}"`;

                generatedComment.classList.remove('hidden');
                promptDisplay.classList.remove('hidden');
                commentContent.textContent = 'Generating comment...';
                
                const generatedText = await APIService.generateComment(
                    post.postContent,
                    post.posterName
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
}

function updatePostsDisplay(posts) {
    const postContainer = document.getElementById('post-container');
    const postTemplate = document.getElementById('post-template');

    if (!postContainer || !postTemplate) return;

    // Create a map of new posts by their IDs
    const newPostsMap = new Map(posts.map(post => [post.elementId, post]));
    
    // Remove posts that are no longer visible
    for (const [postId, element] of currentPosts.entries()) {
        if (!newPostsMap.has(postId)) {
            element.classList.add('fade-out');
            setTimeout(() => {
                if (element.parentNode === postContainer) {
                    postContainer.removeChild(element);
                }
                currentPosts.delete(postId);
            }, 300);
        }
    }

    // Add or update visible posts
    for (const [postId, post] of newPostsMap.entries()) {
        // Skip if post already exists
        if (currentPosts.has(postId)) {
            continue;
        }

        // Create new post element
        const postElement = document.importNode(postTemplate.content, true).firstElementChild;
        postElement.id = postId;
        
        // Set post content
        postElement.querySelector('.poster-name').textContent = post.posterName;
        postElement.querySelector('.post-content').textContent = post.postContent;
        
        // Add event listeners for buttons
        setupPostEventListeners(postElement, post);
        
        // Add to container with animation
        postElement.classList.add('fade-in');
        postContainer.appendChild(postElement);
        currentPosts.set(postId, postElement);
        
        setTimeout(() => postElement.classList.remove('fade-in'), 300);
    }
}

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
    initializeWindowState();
    setupWindowResizeHandler();
    setupWindowControls();
    setupScrollSync();
    
    // Restore last window size and position
    chrome.storage.local.get('windowSize', (data) => {
        if (data.windowSize) {
            chrome.windows.getCurrent((window) => {
                chrome.windows.update(window.id, {
                    width: data.windowSize.width,
                    height: data.windowSize.height,
                    left: data.windowSize.left,
                    top: data.windowSize.top
                });
            });
        }
    });

    // Restore window pin state
    chrome.storage.local.get('windowPinned', (data) => {
        if (data.windowPinned) {
            const togglePinBtn = document.getElementById('togglePin');
            if (togglePinBtn) {
                togglePinBtn.click();
            }
        }
    });
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

let lastUpdateTimestamp = 0;
const UPDATE_THRESHOLD = 1000; // 1 second threshold

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Window received message:", request);
    
    // Update debug info
    messageCount++;
    if (debugInfo.messageCount) {
        debugInfo.messageCount.textContent = `Messages received: ${messageCount}`;
    }
    if (debugInfo.lastMessage) {
        debugInfo.lastMessage.textContent = `Last message: ${JSON.stringify(request)}`;
    }

    // Handle visible posts updates
    if (request.action === "updateVisiblePosts") {
        const currentTime = Date.now();
        if (currentTime - lastUpdateTimestamp > UPDATE_THRESHOLD) {
            lastUpdateTimestamp = currentTime;
            updatePostsDisplay(request.posts);
            sendResponse({ status: "success" });
        } else {
            console.log("Skipping update due to throttling");
            sendResponse({ status: "throttled" });
        }
    }

    // Handle post content setting
    if (request.action === "setPostContent") {
        const currentTime = Date.now();
        if (currentTime - lastUpdateTimestamp > UPDATE_THRESHOLD) {
            lastUpdateTimestamp = currentTime;
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
        } else {
            console.log("Skipping content update due to throttling");
            sendResponse({ status: "throttled" });
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

function setupScrollSync() {
    const postContainer = document.getElementById('post-container');
    let isScrolling = false;

    if (postContainer) {
        postContainer.addEventListener('scroll', debounce(() => {
            if (!isScrolling) {
                const scrollPosition = postContainer.scrollTop;
                // Calculate relative scroll position as a percentage
                const scrollPercentage = (scrollPosition / (postContainer.scrollHeight - postContainer.clientHeight)) * 100;
                
                chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                    if (tabs[0]) {
                        chrome.tabs.sendMessage(tabs[0].id, {
                            action: "syncScroll",
                            position: scrollPosition,
                            percentage: scrollPercentage,
                            source: "extension"
                        });
                    }
                });
            }
        }, 50));
    }

    // Listen for scroll sync messages from LinkedIn page
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "syncScroll" && request.source === "linkedin") {
            const postContainer = document.getElementById('post-container');
            if (postContainer) {
                isScrolling = true;
                // Calculate position based on the same percentage
                const maxScroll = postContainer.scrollHeight - postContainer.clientHeight;
                const scrollPosition = (request.percentage / 100) * maxScroll;
                
                postContainer.scrollTo({
                    top: scrollPosition,
                    behavior: 'smooth'
                });
                
                setTimeout(() => {
                    isScrolling = false;
                }, 100);
            }
        }
    });
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
