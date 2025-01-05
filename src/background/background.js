console.log("Simplified background script loaded");

chrome.runtime.onInstalled.addListener(() => {
  console.log("Service worker installed.");
});

chrome.action.onClicked.addListener(async (tab) => {
    console.log("Extension icon clicked. Tab URL:", tab.url);
    
    if (!tab.url.includes("linkedin.com")) {
        // Show an error notification
        await chrome.windows.create({
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
            width: 800,
            height: 600
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

            // Get the popup tab
            const popupViews = chrome.extension.getViews({ type: "popup" });
            if (popupViews && popupViews.length > 0) {
                const popupView = popupViews[0];

                // Send the posts to the popup
                popupView.chrome.runtime.sendMessage({
                    action: "setPostContent",
                    postContent: response?.posts || [],
                    debug: response?.debug || {}
                }, function(response) {
                    if (chrome.runtime.lastError) {
                        console.error("Error sending message to popup:", chrome.runtime.lastError);
                    } else {
                        console.log("Response from popup:", response);
                    }
                });
            }
        } catch (error) {
            console.error("Error in message handling:", error);
        }

    } catch (error) {
        console.error("Error in click handler:", error);
    }
});
