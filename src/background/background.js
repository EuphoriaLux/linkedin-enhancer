// background.js

console.log("Background script loaded with debug logging");

chrome.runtime.onInstalled.addListener(() => {
    console.log("Service worker installed successfully");
});

// Setup connection handling
let ports = new Map();

// Track the extension window ID
let extensionWindowId = null;

// Listen for connections (e.g., ports for scroll-sync)
chrome.runtime.onConnect.addListener((port) => {
    if (port.name === "scroll-sync") {
        const tabId = port.sender.tab.id;
        ports.set(tabId, port);
        
        port.onDisconnect.addListener(() => {
            ports.delete(tabId);
            console.log(`Port disconnected for tab ${tabId}`);
        });
        
        port.onMessage.addListener((message) => {
            if (message.action === "syncScroll") {
                // Forward scroll sync messages to other connected ports
                ports.forEach((p, id) => {
                    if (id !== tabId) {
                        try {
                            p.postMessage(message);
                        } catch (error) {
                            console.log("Error forwarding scroll sync message:", error);
                        }
                    }
                });
            }
        });
    }
});

// Listen for messages from content scripts or other parts of the extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "updateVisiblePosts") {
        // Forward the message to the extension window
        if (extensionWindowId) {
            chrome.tabs.sendMessage(extensionWindowId, {
                action: "updateVisiblePosts",
                posts: request.posts,
                timestamp: request.timestamp
            }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error("Failed to send message to extension window:", chrome.runtime.lastError.message);
                } else {
                    console.log("Message forwarded to extension window successfully.");
                }
            });
        } else {
            console.warn("Extension window is not open. Cannot forward 'updateVisiblePosts' message.");
        }
        sendResponse({ status: "success" });
    } else if (request.action === "registerWindow") {
        // Register the extension window's tab ID
        const tabId = sender.tab.id;
        if (extensionWindowId && extensionWindowId !== tabId) {
            console.warn(`Another extension window is already registered (Tab ID: ${extensionWindowId}). Overwriting with new Tab ID: ${tabId}`);
        }
        extensionWindowId = tabId;
        console.log(`Registered extension window with Tab ID: ${extensionWindowId}`);
        sendResponse({ status: "registered" });
    }
    return true;
});

// Listen for the extension window tab closing
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    if (tabId === extensionWindowId) {
        console.log("Extension window tab closed.");
        extensionWindowId = null;
    }
});

// Handle extension icon clicks
chrome.action.onClicked.addListener(async (tab) => {
    console.log("Extension icon clicked:", {
        tabId: tab.id,
        tabUrl: tab.url,
        timestamp: new Date().toISOString()
    });
    
    console.log("Checking if the current tab is a LinkedIn page...");
    if (!tab.url.includes("linkedin.com")) {
        console.log("Not a LinkedIn page, skipping window creation");
        console.log("Not a LinkedIn page, showing error popup");
        try {
            const errorWindow = await chrome.windows.create({
                focused: true,
                url: chrome.runtime.getURL("window/window.html?error=not_linkedin"),
                type: "popup",
                width: 400,
                height: 200
            });
            console.log("Error window created:", errorWindow);
        } catch (error) {
            console.error("Failed to create error window:", error);
        }
        return;
    }

    try {
        // Define windowUrl
        const windowUrl = chrome.runtime.getURL("window/window.html");

        // Check if the extension window is already open
        const existingWindows = await chrome.windows.getAll({ populate: true });
        const extensionWindow = existingWindows.find(win => 
            win.type === "popup" && 
            win.tabs.some(tab => tab.url.startsWith(windowUrl))
        );

        if (extensionWindow) {
            // Focus the existing window instead of creating a new one
            console.log("Extension window already open, focusing it...");
            await chrome.windows.update(extensionWindow.id, { focused: true });
            // Update extensionWindowId
            const extensionTab = extensionWindow.tabs.find(tab => tab.url.startsWith(windowUrl));
            if (extensionTab) {
                extensionWindowId = extensionTab.id;
                console.log("Extension window tab ID updated to:", extensionWindowId);
            }
            return;
        }

        console.log("Current tab is a LinkedIn page, proceeding with window creation...");
        const originalTabId = tab.id;
        
        // Get display information
        const displays = await chrome.system.display.getInfo();
        const primaryDisplay = displays.find(d => d.isPrimary) || displays[0];
        
        // Calculate dimensions
        const screenWidth = primaryDisplay.workArea.width;
        const screenHeight = primaryDisplay.workArea.height;
        
        // Update LinkedIn window (left side)
        await chrome.windows.update(tab.windowId, {
            state: 'normal',
            left: 0,
            top: 0,
            width: Math.floor(screenWidth * 0.6),
            height: screenHeight
        });

        // Create extension window (right side)
        const extensionWidth = Math.floor(screenWidth * 0.4);
        
        const newWindow = await chrome.windows.create({
            url: windowUrl,
            type: "popup",
            width: extensionWidth,
            height: screenHeight,
            left: Math.floor(screenWidth * 0.6),
            top: 0,
            focused: true
        }).catch(error => {
            console.error("Window creation failed:", error);
            throw error;
        });
        
        if (chrome.runtime.lastError) {
            console.error("Error creating window:", chrome.runtime.lastError);
            return;
        }

        if (!newWindow) {
            console.error("New window is null or undefined");
            return;
        }

        console.log("Window created successfully:", newWindow);
        // Do not immediately search for the extension tab; rely on the "registerWindow" message
        // Instead, set up the `chrome.tabs.onUpdated` listener to catch the tab once it's loaded
        const listener = (tabId, changeInfo, tab) => {
            if (changeInfo.status === 'complete' && tab.url.startsWith(windowUrl)) {
                extensionWindowId = tabId;
                console.log("Extension window tab ID set to:", extensionWindowId);
                chrome.tabs.onUpdated.removeListener(listener);

                // Now, proceed to inject the content script and send messages
                injectContentScriptAndSendPosts(originalTabId);
            }
        };

        chrome.tabs.onUpdated.addListener(listener);

        // Inject content script and send posts (if window is already registered)
        if (extensionWindowId) {
            injectContentScriptAndSendPosts(originalTabId);
        }

    } catch (error) {
        console.error("Error in click handler:", {
            error,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
        console.error("Error in click handler:", error);
    }
});

// Function to inject content script and send posts
async function injectContentScriptAndSendPosts(originalTabId) {
    console.log("Attempting to inject content script...");
    try {
        console.log("Injecting content script...");
        await chrome.scripting.executeScript({
            target: { tabId: originalTabId },
            files: ['content_scripts/content.js']
        }).catch(error => {console.error("Error injecting content script:", error);});

        if (chrome.runtime.lastError) {
            console.error("Error injecting content script:", chrome.runtime.lastError);
            return;
        }
        
        console.log("Content script injected successfully");
    } catch (error) {
        console.error("Content script injection failed:", error);
        throw error;
    }

    // Add delay with logging
    console.log("Starting delay before message send...");
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log("Delay completed, sending message to content script...");

    try {
        console.log("Sending message to content script...");
        const response = await new Promise((resolve, reject) => {
            chrome.tabs.sendMessage(originalTabId, {
                action: "getPostContent",
                timestamp: new Date().toISOString(),
            }, response => {
                if (chrome.runtime.lastError) {
                    console.error("Message send error:", chrome.runtime.lastError.message);
                    reject(chrome.runtime.lastError);
                } else {
                    console.log("Message sent successfully, received response:", response);
                    resolve(response);
                }
            });
        });

        if (extensionWindowId) {
            console.log("Sending posts to extension window...");
            await chrome.tabs.sendMessage(extensionWindowId, {
                action: "updateVisiblePosts", // Ensure this matches the listener in window.js
                posts: response?.posts || [],
                timestamp: new Date().toISOString(),
                debug: {
                    ...response?.debug || {},
                    messageTimestamp: new Date().toISOString(),
                }
            }).catch(error => {
                console.error("Failed to send posts to window:", error);
                throw error;
            });
            
            console.log("Posts sent to window successfully");
        } else {
            console.error("Extension window ID is not set. Cannot send posts.");
        }
    } catch (error) {
        console.error("Error in message handling:", {
            error,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
        throw error;
    }
}
