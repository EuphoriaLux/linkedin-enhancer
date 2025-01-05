if (window.linkedInEnhancerInitialized) {
    console.log("LinkedIn Enhancer already initialized, skipping...");
} else {
    window.linkedInEnhancerInitialized = true;
    let lastKnownPosts = [];
    let isProcessingScroll = false;
    let isScrolling = false;

    console.log("Content script loaded and running");

    function setupMessageListeners() {
        try {
            chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
                if (chrome.runtime.lastError) {
                    console.error('Runtime error:', chrome.runtime.lastError);
                    return;
                }
                // Existing message listener code remains unchanged
            });
        } catch (error) {
            console.error('Failed to setup message listeners:', error);
            if (error.message.includes('Extension context invalidated')) {
                window.linkedInEnhancerInitialized = false;
            }
        }
    }

    setupMessageListeners();

    // Add scroll event listener
    window.addEventListener('scroll', debounce(handleScroll, 250));

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

    async function handleScroll() {
        if (isProcessingScroll) return;
        
        try {
            isProcessingScroll = true;
            const visiblePosts = getVisiblePosts();
            
            if (JSON.stringify(visiblePosts) !== JSON.stringify(lastKnownPosts)) {
                lastKnownPosts = visiblePosts;
                
                try {
                    await chrome.runtime.sendMessage({
                        action: "updateVisiblePosts",
                        posts: visiblePosts,
                        timestamp: new Date().toISOString()
                    });
                } catch (error) {
                    if (error.message.includes('Extension context invalidated')) {
                        window.linkedInEnhancerInitialized = false;
                        return;
                    }
                    console.error('Failed to send message:', error);
                }

                // Add scroll position tracking and syncing
                window.addEventListener('scroll', debounce(() => {
                    if (!isScrolling) {
                        const scrollPosition = window.scrollY;
                        chrome.runtime.sendMessage({
                            action: "syncScroll",
                            position: scrollPosition,
                            source: "linkedin"
                        });
                    }
                }, 50));

                // Listen for scroll sync messages from extension window
                chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
                    if (request.action === "syncScroll" && request.source === "extension") {
                        isScrolling = true;
                        window.scrollTo({
                            top: request.position,
                            behavior: 'smooth'
                        });
                        setTimeout(() => {
                            isScrolling = false;
                        }, 100);
                    }
                });
            }
        } finally {
            isProcessingScroll = false;
        }
    }

    function getVisiblePosts() {
        const posts = [];
        const seenPosts = new Set(); // Track unique posts
    
        const postElements = document.querySelectorAll([
            'div.feed-shared-update-v2',
            'div.occludable-update',
            'div[data-urn]'
        ].join(', '));

        postElements.forEach((element, index) => {
            const rect = element.getBoundingClientRect();
            const isVisible = (
                rect.top >= 0 &&
                rect.top <= (window.innerHeight || document.documentElement.clientHeight)
            );

            if (isVisible) {
                try {
                    const postData = extractPostData(element, index);
                    if (postData.isValid) {
                        // Create a unique identifier based on content and name
                        const postId = `${postData.posterName}-${postData.postContent.substring(0, 50)}`;
                    
                        // Only add if we haven't seen this post before
                        if (!seenPosts.has(postId)) {
                            seenPosts.add(postId);
                            posts.push({
                                posterName: postData.posterName,
                                postContent: postData.postContent,
                                elementId: postId,
                                position: rect.top,
                                timestamp: new Date().toISOString()
                            });
                        }
                    }
                } catch (error) {
                    console.error(`Error processing visible post ${index}:`, error);
                }
            }
        });

        return posts;
    }

    // Debug configuration
    const DEBUG = {
        enabled: true,
        logPostHTML: true,
        logSelectors: true
    };

    function debugLog(...args) {
        if (DEBUG.enabled) {
            console.log(...args);
        }
    }

    function debugError(...args) {
        if (DEBUG.enabled) {
            console.error(...args);
        }
    }

    chrome.runtime.onMessage.addListener(
        function(request, sender, sendResponse) {
            debugLog("Content script received message:", request);
            
            if (request.action === "getPostContent") {
                try {
                    debugLog("Getting LinkedIn posts...");
                    const postContent = getLinkedInPosts();
                    debugLog("Retrieved posts:", postContent);
                    
                    // Send response immediately
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
            }
        }
    );

    function getLinkedInPosts() {
        debugLog("Starting to extract posts");
        const posts = [];
        
        // Updated selectors for modern LinkedIn feed
        const postContainers = document.querySelectorAll([
            'div.feed-shared-update-v2',
            'div.occludable-update',
            'div[data-urn]',
            'div.feed-shared-update-v2__content',
            'div.update-components-actor',
            'div.feed-shared-actor'
        ].join(', '));
        
        debugLog(`Found ${postContainers.length} potential post containers`);

        if (postContainers.length === 0) {
            debugError("No post containers found. DOM structure may have changed.");
            return [];
        }

        postContainers.forEach((postContainer, index) => {
            try {
                if (DEBUG.logPostHTML) {
                    debugLog(`Post ${index + 1} HTML:`, postContainer.outerHTML);
                }

                const postData = extractPostData(postContainer, index);
                
                if (postData.isValid) {
                    posts.push({
                        posterName: postData.posterName,
                        postContent: postData.postContent,
                        timestamp: new Date().toISOString(),
                        index: index
                    });
                }
            } catch (error) {
                debugError(`Error processing post ${index + 1}:`, error);
            }
        });

        debugLog(`Successfully extracted ${posts.length} valid posts`);
        return posts.filter(post => post.postContent && post.postContent !== "Content not available");
    }

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

        let posterName = findElementContent(postContainer, nameSelectors, 'name', index);
        let postContent = findElementContent(postContainer, contentSelectors, 'content', index);

        // Clean up the extracted text
        if (postContent) {
            postContent = cleanUpPostContent(postContent);
            postContent = removeNameFromContent(postContent, posterName);
        }

        return {
            posterName: posterName || "Unknown User",
            postContent: postContent || "Content not available",
            isValid: Boolean(posterName && postContent && 
                            postContent !== "Content not available")
        };
    }

    function findElementContent(container, selectors, type, postIndex) {
        for (let selector of selectors) {
            try {
                if (DEBUG.logSelectors) {
                    debugLog(`Trying ${type} selector on post ${postIndex + 1}:`, selector);
                }
                
                const element = container.querySelector(selector);
                if (element) {
                    const content = element.textContent;
                    if (content && content.trim()) {
                        debugLog(`Found ${type} using selector "${selector}":`, content.trim());
                        return content.trim();
                    }
                }
            } catch (error) {
                debugError(`Error with selector "${selector}":`, error);
            }
        }
        debugLog(`Could not find ${type} for post ${postIndex + 1}`);
        return null;
    }

    function cleanUpPostContent(text) {
        if (text) {
            // Remove extra whitespace and line breaks
            let cleanedText = text.replace(/\s+/g, ' ').trim();
            // Remove any leading or trailing newlines
            cleanedText = cleanedText.replace(/^\n+|\n+$/g, '');
            // Handle HTML entities and decode them
            const tempElement = document.createElement('div');
            tempElement.innerHTML = cleanedText;
            cleanedText = tempElement.textContent || "";
            return cleanedText;
        }
        return "";
    }

    function removeNameFromContent(content, name) {
        if (!content || !name) {
            return content;
        }

        // Split name into parts to handle first/last name separately
        const nameParts = name.split(/\s+/);

        // Create a regex that matches:
        // 1. The exact full name
        // 2. The name followed by "shared" or "posted"
        // 3. The name at the start of the content
        const patterns = [
            `(${name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\s*)`,
            `(${name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\s*(shared|posted|writes|commented|likes))`,
            `^(${name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\s*)`
        ];

        let cleanContent = content;

        // Apply each pattern
        patterns.forEach(pattern => {
            const regex = new RegExp(pattern, 'gi');
            cleanContent = cleanContent.replace(regex, '');
        });

        // Clean up any resulting double spaces and trim
        cleanContent = cleanContent.replace(/\s+/g, ' ').trim();

        return cleanContent;
    }
}
