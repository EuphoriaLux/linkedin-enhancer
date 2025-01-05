console.log("Popup script loaded");

// Initialize theme
function initializeTheme() {
    chrome.storage.sync.get('theme', function(data) {
        if (data.theme) {
            document.body.setAttribute('data-theme', data.theme);
        }
    });
}

// Initialize theme when popup loads
document.addEventListener('DOMContentLoaded', initializeTheme);

// Listen for theme changes
chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (changes.theme) {
        document.body.setAttribute('data-theme', changes.theme.newValue);
    }
});

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        chrome.runtime.sendMessage({ action: "popupReady" });
        if (request.action === "setPostContent") {
            console.log("Popup script - Received posts:", request.postContent);
            const posts = request.postContent;

            document.body.innerHTML = '<h1>LinkedIn Enhancer</h1><p>This is the popup.</p>';

            if (Array.isArray(posts)) {
                posts.forEach(post => {
                    const postDiv = document.createElement('div');
                    postDiv.innerHTML = `<h3>${post.posterName}</h3>${post.postContent}`;
                    postDiv.style.padding = '10px';
                    postDiv.style.border = '1px solid var(--border-color)';
                    postDiv.style.margin = '10px';
                    postDiv.style.whiteSpace = 'pre-line';
                    document.body.appendChild(postDiv);
                });
            } else {
                const contentDiv = document.createElement('div')
                contentDiv.textContent = "Could not retrieve post content.";
                document.body.appendChild(contentDiv)
            }
        }
    }
);
