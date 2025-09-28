// Options page functionality
document.addEventListener('DOMContentLoaded', function() {
    const apiKeyInput = document.getElementById('apiKey');
    const customPromptInput = document.getElementById('customPrompt');
    const saveButton = document.getElementById('save');
    const resetButton = document.getElementById('reset');
    const statusDiv = document.getElementById('status');

    // Default prompt
    const defaultPrompt = `Please provide a comprehensive summary of this YouTube video transcript. Include:

1. **Main Topic**: What is the video primarily about?
2. **Key Points**: List the most important points discussed (3-5 bullet points)
3. **Key Insights**: Any valuable insights, lessons, or takeaways
4. **Conclusion**: Brief wrap-up of the main message

Keep the summary concise but informative, around 200-300 words.`;

    // Load saved settings
    loadSettings();

    // Event listeners
    saveButton.addEventListener('click', saveSettings);
    resetButton.addEventListener('click', resetSettings);

    // Auto-hide status after 3 seconds
    function showStatus(message, type = 'success') {
        statusDiv.textContent = message;
        statusDiv.className = `status ${type}`;

        setTimeout(() => {
            statusDiv.classList.add('hidden');
        }, 3000);
    }

    // Load settings from storage
    async function loadSettings() {
        try {
            const result = await chrome.storage.sync.get(['openaiApiKey', 'customPrompt']);

            if (result.openaiApiKey) {
                apiKeyInput.value = result.openaiApiKey;
            }

            if (result.customPrompt) {
                customPromptInput.value = result.customPrompt;
            } else {
                customPromptInput.placeholder = defaultPrompt;
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            showStatus('Error loading settings', 'error');
        }
    }

    // Save settings to storage
    async function saveSettings() {
        const apiKey = apiKeyInput.value.trim();
        const customPrompt = customPromptInput.value.trim();

        // Validate API key
        if (!apiKey) {
            showStatus('Please enter your OpenAI API key', 'error');
            apiKeyInput.focus();
            return;
        }

        if (!apiKey.startsWith('sk-')) {
            showStatus('Invalid API key format. OpenAI API keys start with "sk-"', 'error');
            apiKeyInput.focus();
            return;
        }

        try {
            // Test API key by making a simple request
            showStatus('Validating API key...', 'info');

            const testResponse = await fetch('https://api.openai.com/v1/models', {
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                }
            });

            if (!testResponse.ok) {
                throw new Error('Invalid API key');
            }

            // Save to storage
            await chrome.storage.sync.set({
                openaiApiKey: apiKey,
                customPrompt: customPrompt || null
            });

            showStatus('Settings saved successfully!', 'success');
        } catch (error) {
            console.error('Error saving settings:', error);
            showStatus('Invalid API key. Please check and try again.', 'error');
        }
    }

    // Reset settings to defaults
    async function resetSettings() {
        if (confirm('Are you sure you want to reset all settings to defaults?')) {
            try {
                await chrome.storage.sync.clear();
                apiKeyInput.value = '';
                customPromptInput.value = '';
                customPromptInput.placeholder = defaultPrompt;
                showStatus('Settings reset to defaults', 'success');
            } catch (error) {
                console.error('Error resetting settings:', error);
                showStatus('Error resetting settings', 'error');
            }
        }
    }

    // Handle Enter key in API key field
    apiKeyInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            saveSettings();
        }
    });
});