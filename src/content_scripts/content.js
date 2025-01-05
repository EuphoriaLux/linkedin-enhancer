// content.js

(function() {
    if (window.linkedInEnhancerInitialized) {
        console.log("LinkedIn Enhancer already initialized, skipping...");
        return;
    }

    window.linkedInEnhancerInitialized = true;

    const DEBUG = true; // Set to false to disable debug logs

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

    // Function to sanitize strings to prevent injection issues
    function sanitize(str) {
        if (!str) return "";
        return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    }

    // Function to find content using selectors
    function findElementContent(container, selectors, type, postIndex) {
        for (const selector of selectors) {
            try {
                const element = container.querySelector(selector);
                if (element) {
                    const content = element.textContent.trim();
                    if (content) {
                        return content;
                    }
                }
            } catch (error) {
                debugError(`Error with selector "${selector}" for ${type} in post ${postIndex + 1}:`, error);
            }
        }
        return null;
    }

    // Function to clean up post content
    function cleanUpPostContent(text) {
        if (!text) return "";
        const tempElement = document.createElement('div');
        tempElement.innerHTML = text.replace(/\s+/g, ' ').trim();
        return tempElement.textContent || "";
    }

    // Function to remove poster's name from content
    function removeNameFromContent(content, name) {
        if (!content || !name) return content;

        const sanitizedName = sanitize(name);
        const regex = new RegExp(`^${sanitizedName}\\s*`, 'i');
        return content.replace(regex, '').trim();
    }

    // Set to track processed posts
    const processedPostIds = new Set();

    // Function to extract data from a post element
    function extractPostData(postContainer, index) {
        const nameSelectors = [
            'span.update-components-actor__name',
            'span.feed-shared-actor__name',
            'span.update-components-actor__title',
            'a.update-components-actor__meta-link',
            'a[data-control-name="actor_container"] span',
            'div.update-components-actor__meta-link',
            '.actor-name',
            'div.feed-shared-actor__title span'
        ];

        const contentSelectors = [
            'div.feed-shared-update-v2__description-wrapper',
            'div.feed-shared-text-view',
            'div.update-components-text',
            'div.feed-shared-text',
            'div.update-components-text__text-view',
            'div.feed-shared-update-v2__commentary',
            'span[dir="ltr"]',
            'div.feed-shared-inline-show-more-text'
        ];

        let posterName = findElementContent(postContainer, nameSelectors, 'name', index) || "Unknown User";
        let postContent = findElementContent(postContainer, contentSelectors, 'content', index) || "Content not available";

        if (postContent) {
            postContent = cleanUpPostContent(postContent);
            postContent = removeNameFromContent(postContent, posterName);
        }

        // Attempt to extract a unique identifier from the post container
        let uniqueId = postContainer.getAttribute('data-urn') || `${sanitize(posterName)}-${sanitize(postContent.substring(0, 50))}`;

        return {
            posterName: posterName,
            postContent: postContent,
            uniqueId: uniqueId,
            isValid: Boolean(posterName && postContent && postContent !== "Content not available")
        };
    }

    // Function to get LinkedIn posts
    function getLinkedInPosts() {
        const posts = [];
        const postContainers = document.querySelectorAll([
            'div.feed-shared-update-v2',
            'div.occludable-update',
            'div[data-urn]',
            'div.feed-shared-update-v2__content',
            'div.update-components-actor',
            'div.feed-shared-actor'
        ].join(', '));

        postContainers.forEach((postContainer, index) => {
            try {
                const postData = extractPostData(postContainer, index);
                if (postData.isValid && !processedPostIds.has(postData.uniqueId)) {
                    posts.push({
                        posterName: postData.posterName,
                        postContent: postData.postContent,
                        timestamp: new Date().toISOString(),
                        index: index
                    });
                    processedPostIds.add(postData.uniqueId);
                }
            } catch (error) {
                debugError(`Error processing post ${index + 1}:`, error);
            }
        });

        return posts.filter(post => post.postContent && post.postContent !== "Content not available");
    }

    // Initialization
    function initializeContentScript() {
        let lastKnownPosts = [];
        let isProcessingScroll = false;
        let isValid = true;
        let isScrolling = false;
        let port = null;

        // Utility function for debouncing
        function debounce(func, wait) {
            let timeout;
            return function(...args) {
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(this, args), wait);
            };
        }

        // Handle extension invalidation and cleanup
        function handleExtensionInvalidation() {
            if (!isValid) return; // Prevent multiple invalidations
            isValid = false;
            window.linkedInEnhancerInitialized = false;

            // Remove scroll listener
            window.removeEventListener('scroll', handleScrollDebounced);

            // Disconnect port if it exists
            if (port) {
                try {
                    port.disconnect();
                    debugLog("Port disconnected during invalidation");
                } catch (error) {
                    debugError("Error disconnecting port:", error);
                }
                port = null;
            }

            // Clear stored data
            lastKnownPosts = [];
            isProcessingScroll = false;

            debugLog("Extension context invalidated, cleanup completed");
        }

        // Setup connection port
        function setupConnectionPort() {
            if (!isValid) return;

            try {
                port = chrome.runtime.connect({ name: "scroll-sync" });
                debugLog("Port connected with name 'scroll-sync'");

                port.onDisconnect.addListener(() => {
                    if (chrome.runtime.lastError) {
                        const error = chrome.runtime.lastError.message;
                        if (error.includes('Extension context invalidated')) {
                            handleExtensionInvalidation();
                            return;
                        }
                    }
                    debugLog("Content script port disconnected, attempting reconnection...");
                    setTimeout(setupConnectionPort, 1000);
                });

                port.onMessage.addListener((message) => {
                    // Handle incoming messages on the port if needed
                    debugLog("Received message on port:", message);
                    // Example: handleScrollSyncMessage(message);
                });
            } catch (error) {
                if (error.message.includes('Extension context invalidated')) {
                    handleExtensionInvalidation();
                    return;
                }
                debugError("Content script port connection failed, retrying...", error);
                setTimeout(setupConnectionPort, 1000);
            }
        }

        setupConnectionPort();

        debugLog("Content script loaded and running");

        // Setup message listeners
        function setupMessageListeners() {
            if (!isValid) return;

            chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
                if (!isValid) {
                    sendResponse({ status: "invalid" });
                    return;
                }

                if (request.action === "syncScroll" && request.source === "extension") {
                    isScrolling = true;
                    window.scrollTo({
                        top: request.position,
                        behavior: 'smooth'
                    });
                    setTimeout(() => {
                        isScrolling = false;
                    }, 100);
                    sendResponse({ status: "success" });
                }
                return true; // Keep the message channel open for async response
            });
        }

        setupMessageListeners();

        // Debounced scroll handler
        const handleScrollDebounced = debounce(handleScroll, 250);
        window.addEventListener('scroll', handleScrollDebounced);

        // Cleanup on window unload
        window.addEventListener('unload', handleExtensionInvalidation);

        async function handleScroll() {
            if (!window.linkedInEnhancerInitialized || !isValid || isProcessingScroll || isScrolling) {
                return;
            }

            isProcessingScroll = true;

            try {
                // Check extension context before proceeding
                if (!chrome.runtime?.id) {
                    handleExtensionInvalidation();
                    return;
                }

                const visiblePosts = getVisiblePosts(); // Or use getLinkedInPosts()

                if (!arePostsEqual(visiblePosts, lastKnownPosts)) {
                    lastKnownPosts = visiblePosts;

                    await chrome.runtime.sendMessage({
                        action: "updateVisiblePosts",
                        posts: visiblePosts,
                        timestamp: new Date().toISOString()
                    });
                }
            } catch (error) {
                if (error.message && error.message.includes('Extension context invalidated')) {
                    handleExtensionInvalidation();
                }
                debugError('Scroll handling error:', error);
            } finally {
                isProcessingScroll = false;
            }
        }

        // Utility to compare posts
        function arePostsEqual(posts1, posts2) {
            if (posts1.length !== posts2.length) return false;
            return posts1.every((post, index) => {
                const other = posts2[index];
                return post.posterName === other.posterName &&
                       post.postContent === other.postContent &&
                       post.position === other.position;
            });
        }

        // Setup MutationObserver to monitor dynamic content changes
        function setupMutationObserver() {
            // Update the selector based on LinkedIn's current DOM structure
            const targetNode = document.querySelector('div.scaffold-layout__main'); // Example selector; adjust as needed
            if (!targetNode) {
                debugError("Target node for MutationObserver not found.");
                return;
            }

            const config = { childList: true, subtree: true };

            let mutationTimeout = null;
            const debounceTime = 500; // Adjust as needed

            const callback = function(mutationsList, observer) {
                if (mutationTimeout) return; // Throttle the processing

                mutationTimeout = setTimeout(() => {
                    mutationTimeout = null;

                    // Process all mutations that occurred within the delay period
                    debugLog("Processing batched mutations.");

                    const newPosts = getLinkedInPosts();

                    const freshPosts = newPosts.filter(post => {
                        if (processedPostIds.has(post.uniqueId)) {
                            return false;
                        } else {
                            processedPostIds.add(post.uniqueId);
                            return true;
                        }
                    });

                    if (freshPosts.length > 0) {
                        chrome.runtime.sendMessage({
                            action: "updateVisiblePosts",
                            posts: freshPosts,
                            timestamp: new Date().toISOString()
                        }).then(response => {
                            debugLog("Sent new posts to background:", response);
                        }).catch(error => {
                            debugError("Failed to send new posts to background:", error);
                        });
                    }
                }, debounceTime);
            };

            const observer = new MutationObserver(callback);
            observer.observe(targetNode, config);

            debugLog("MutationObserver set up successfully.");
        }

        setupMutationObserver();
    }

    // Function to listen for getPostContent messages
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "getPostContent") {
            try {
                const postContent = getLinkedInPosts();
                sendResponse({ 
                    posts: postContent,
                    debug: {
                        totalPostsFound: postContent.length,
                        timestamp: new Date().toISOString()
                    }
                });
            } catch (error) {
                debugError("Error getting posts:", error);
                sendResponse({ 
                    posts: [], 
                    error: error.message,
                    debug: {
                        errorStack: error.stack,
                        timestamp: new Date().toISOString()
                    }
                });
            }
            return true; // Keep the message channel open for async response
        }
    });

})();
