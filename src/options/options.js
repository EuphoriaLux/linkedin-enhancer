// Save options to chrome.storage
function saveOptions() {
    const apiKey = document.getElementById('apiKey').value.trim();
    const defaultPrompt = document.getElementById('defaultPrompt').value.trim();
    const aiModel = document.getElementById('aiModel').value;
    const temperature = parseFloat(document.getElementById('temperature').value);
    const maxTokens = parseInt(document.getElementById('maxTokens').value);
    const promptStyle = document.getElementById('promptStyle').value;
    const blacklist = document.getElementById('blacklist').value.trim();
    const theme = document.getElementById('theme').value;
    const fontSize = document.getElementById('fontSize').value;
    const status = document.getElementById('status');

    // Validate API key
    if (!apiKey) {
        showStatus('API key is required.', 'error');
        return;
    }

    if (!apiKey.match(/^[A-Za-z0-9-_]+$/)) {
        showStatus('Invalid API key format. Please check your key.', 'error');
        return;
    }

    // Validate prompt
    if (!defaultPrompt) {
        showStatus('Default prompt is required.', 'error');
        return;
    }

    const maxPosts = parseInt(document.getElementById('maxPosts').value);
    const debugMode = document.getElementById('debugMode').checked;
    const autoExpand = document.getElementById('autoExpand').checked;
    const customCSS = document.getElementById('customCSS').value.trim();

    if (isNaN(maxPosts) || maxPosts < 1 || maxPosts > 50) {
        showStatus('Maximum posts must be between 1 and 50.', 'error');
        return;
    }

    chrome.storage.sync.set({
        apiKey: apiKey,
        aiModel: aiModel,
        temperature: temperature,
        maxTokens: maxTokens,
        promptStyle: promptStyle,
        defaultPrompt: defaultPrompt,
        blacklist: blacklist,
        theme: theme,
        fontSize: fontSize,
        maxPosts: maxPosts,
        debugMode: debugMode,
        autoExpand: autoExpand,
        customCSS: customCSS
    }, function() {
        if (chrome.runtime.lastError) {
            console.error("Error saving settings:", chrome.runtime.lastError);
            showStatus('Error saving settings: ' + chrome.runtime.lastError.message, 'error');
        } else {
            showStatus('Settings saved successfully.', 'success');
        }
    });
}

// Show status message with specified type (success/error)
function showStatus(message, type = 'success') {
    const status = document.getElementById('status');
    status.textContent = message;
    status.className = `status ${type}`;
    status.style.display = 'block';
    
    if (type === 'success') {
        setTimeout(function() {
            status.style.display = 'none';
        }, 2000);
    }
}

// Restore options from chrome.storage
function restoreOptions() {
    chrome.storage.sync.get({
        apiKey: '',
        aiModel: 'gemini-pro',
        temperature: 0.7,
        maxTokens: 150,
        promptStyle: 'professional-formal',
        defaultPrompt: 'You are a professional LinkedIn user. Generate an engaging and relevant comment for the following LinkedIn post by {name}: "{content}". The comment should be professional, add value to the discussion, and maintain a friendly tone. Keep it concise and natural.',
        blacklist: '',
        theme: 'light',
        fontSize: 'medium',
        maxPosts: 10,
        debugMode: false,
        autoExpand: false,
        customCSS: ''
    }, function(items) {
        if (chrome.runtime.lastError) {
            showStatus('Error loading settings: ' + chrome.runtime.lastError.message, 'error');
            return;
        }
        document.getElementById('apiKey').value = items.apiKey;
        document.getElementById('aiModel').value = items.aiModel;
        document.getElementById('temperature').value = items.temperature;
        document.getElementById('temperatureValue').textContent = items.temperature;
        document.getElementById('maxTokens').value = items.maxTokens;
        document.getElementById('maxTokensValue').textContent = items.maxTokens;
        document.getElementById('promptStyle').value = items.promptStyle;
        document.getElementById('defaultPrompt').value = items.defaultPrompt;
        document.getElementById('blacklist').value = items.blacklist;
        document.getElementById('theme').value = items.theme;
        document.getElementById('fontSize').value = items.fontSize;
        document.getElementById('maxPosts').value = items.maxPosts;
        document.getElementById('debugMode').checked = items.debugMode;
        document.getElementById('autoExpand').checked = items.autoExpand;
        document.getElementById('customCSS').value = items.customCSS;
    });
}

let saveTimeout;
function debouncedSave() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveOptions, 500);
}

function setupAutoSave() {
    // Handle immediate save for checkboxes and select elements
    const immediateElements = document.querySelectorAll('input[type="checkbox"], select');
    immediateElements.forEach(element => {
        element.addEventListener('change', saveOptions);
    });

    // Handle debounced save for text inputs, textareas, and range inputs
    const debouncedElements = document.querySelectorAll(
        'input[type="text"], input[type="number"], textarea, input[type="range"]'
    );
    debouncedElements.forEach(element => {
        if (element.type === 'range') {
            element.addEventListener('input', () => {
                // Update display value immediately
                const valueDisplay = document.getElementById(`${element.id}Value`);
                if (valueDisplay) {
                    valueDisplay.textContent = element.value;
                }
                // Debounce the save
                debouncedSave();
            });
        } else {
            element.addEventListener('input', debouncedSave);
        }
    });
}

// Add input validation listeners
function addValidationListeners() {
    const apiKeyInput = document.getElementById('apiKey');
    const promptInput = document.getElementById('defaultPrompt');
    const maxPostsInput = document.getElementById('maxPosts');
    
    apiKeyInput.addEventListener('input', function() {
        const isValid = this.value.trim().match(/^[A-Za-z0-9-_]*$/);
        this.style.borderColor = isValid ? '' : 'red';
    });

    promptInput.addEventListener('input', function() {
        const value = this.value.trim();
        const hasPlaceholders = value.includes('{content}') && value.includes('{name}');
        this.style.borderColor = hasPlaceholders ? '' : 'red';
    });

    maxPostsInput.addEventListener('input', function() {
        const value = parseInt(this.value);
        const isValid = !isNaN(value) && value >= 1 && value <= 50;
        this.style.borderColor = isValid ? '' : 'red';
    });
}

document.addEventListener('DOMContentLoaded', function() {
    restoreOptions();
    addValidationListeners();
    setupAutoSave();
});
