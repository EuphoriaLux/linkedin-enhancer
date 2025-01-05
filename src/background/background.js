console.log("Simplified background script loaded");

chrome.runtime.onInstalled.addListener(() => {
  console.log("Service worker installed.");
});

chrome.action.onClicked.addListener(async (tab) => {
    console.log("Extension icon clicked. Tab URL:", tab.url);
    
    if (!tab.url.includes("linkedin.com")) {
        // Show an error notification
        chrome.windows.create({
            url: chrome.runtime.getURL("window/window.html?error=not_linkedin"),
            type: "popup",
            width: 400,
            height: 200
        });
        return;
    }

    try {
        const originalTabId = tab.id;

        // Create the window first
        const newWindow = await chrome.windows.create({
            url: "window/window.html",
            type: "popup",
            width: 1000,
            height: 800
        });

        console.log("Injecting content script...");
        await chrome.scripting.executeScript({
            target: { tabId: originalTabId },
            files: ['content_scripts/content.js']
        });
        console.log("Content script injected successfully");

        // Increase timeout and add error handling
        await new Promise(resolve => setTimeout(resolve, 1000));

        try {
            console.log("Sending message to content script to get posts...");
            const response = await new Promise((resolve, reject) => {
                chrome.tabs.sendMessage(originalTabId, {action: "getPostContent"}, response => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                    } else {
                        resolve(response);
                    }
                });
            });

            console.log("Received response from content script:", response);

            // Get the tab in the new window
            const windowTabs = await chrome.tabs.query({windowId: newWindow.id});
            if (windowTabs && windowTabs[0]) {
                const windowTabId = windowTabs[0].id;

                // Send the posts to the new window
                chrome.tabs.sendMessage(windowTabId, {
                    action: "setPostContent",
                    postContent: response?.posts || [],
                    debug: response?.debug || {}
                });
            } else {
                console.error("Could not find tab in new window");
            }
        } catch (error) {
            console.error("Error in message handling:", error);
        }

    } catch (error) {
        console.error("Error in click handler:", error);
    }
});
