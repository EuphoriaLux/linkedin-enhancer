console.log("Background script loaded with debug logging");

chrome.runtime.onInstalled.addListener(() => {
    console.log("Service worker installed successfully");
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "updateVisiblePosts") {
        // Forward the message to the extension window
        chrome.tabs.query({ url: chrome.runtime.getURL("window/window.html") }, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, {
                    action: "updateVisiblePosts",
                    posts: request.posts,
                    timestamp: request.timestamp
                });
            });
        });
        sendResponse({ status: "success" });
    }
    return false;
});

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
        console.log("Current tab is a LinkedIn page, proceeding with window creation...");
        const originalTabId = tab.id;
        console.log("Creating main window...");

        // Create the window first with full URL
        const windowUrl = chrome.runtime.getURL("window/window.html");
        console.log("Setting focus to true for new window");
        console.log("Window URL:", windowUrl);

        const newWindow = await chrome.windows.create({
            url: windowUrl,
            type: "popup",
            width: 1000,
            height: 800,
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
            if (chrome.runtime.lastError) {
                console.error("Content script injection error:", chrome.runtime.lastError);
                throw new Error(`Failed to inject content script: ${chrome.runtime.lastError.message}`);
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
                        console.error("Message send error:", chrome.runtime.lastError);
                        reject(chrome.runtime.lastError);
                    } else {
                        console.log("Message sent successfully, received response:", response);
                        resolve(response);
                    }
                });
            });

            console.log("Querying for window tabs...");
            const windowTabs = await chrome.tabs.query({ windowId: newWindow.id });
            
            if (windowTabs && windowTabs[0]) {
                const windowTabId = windowTabs[0].id;
                console.log("Found window tab:", windowTabId);

                // Send the posts to the new window
                console.log("Sending posts to window...");
                await chrome.tabs.sendMessage(windowTabId, {
                    action: "setPostContent",
                    postContent: response?.posts || [],
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
                console.error("Could not find tab in new window:", {
                    windowId: newWindow.id,
                    tabs: windowTabs
                });
                throw new Error("Window tab not found");
            }
        } catch (error) {
            console.error("Error in message handling:", {
                error,
                stack: error.stack,
                timestamp: new Date().toISOString()
            });
            throw error;
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
