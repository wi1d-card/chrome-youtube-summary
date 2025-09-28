# YouTube Summary Chrome Extension

A Chrome extension that automatically extracts YouTube video transcripts and generates detailed AI-powered summaries in French, while preserving technical terms in English.

## Features

- 🎯 **One-Click Summaries**: Extract and summarize any YouTube video with transcript available
- 🌍 **French Summaries**: Detailed summaries in French with technical terms preserved in English
- 🖥️ **Fullscreen Display**: Large, readable popup for easy content consumption
- 📋 **Copy to Clipboard**: One-click copying of generated summaries
- 🔄 **Regenerate**: Option to generate a new summary if needed
- ⌨️ **Keyboard Shortcut**: Quick access via Cmd/Ctrl+Shift+S
- 🎛️ **Customizable**: Configure your OpenAI API key and custom prompts

## Installation

### From Source

1. Clone this repository:
   ```bash
   git clone https://github.com/sderosiaux/chrome-youtube-summary.git
   cd chrome-youtube-summary
   ```

2. Open Chrome and go to `chrome://extensions/`

3. Enable "Developer mode" in the top right corner

4. Click "Load unpacked" and select the project directory

5. Configure your OpenAI API key:
   - Click on the extension icon and go to "Options"
   - Enter your OpenAI API key
   - Optionally customize the prompt

## Usage

### Method 1: Extension Icon
1. Navigate to any YouTube video with available transcript
2. Click the YouTube Summary extension icon in the toolbar
3. Wait for the AI to generate a detailed summary

### Method 2: Keyboard Shortcut
1. Navigate to any YouTube video with available transcript
2. Press `Cmd+Shift+S` (Mac) or `Ctrl+Shift+S` (Windows/Linux)
3. Wait for the AI to generate a detailed summary

### Summary Structure

The generated summaries include:

- **Résumé brutal en une ligne**: One-line honest summary
- **Sujet Principal**: Detailed topic description and context
- **Points Clés Détaillés**: 8-12 important points with detailed explanations
- **Insights et Leçons Approfondis**: Valuable insights with practical applications
- **Citations et Aphorismes Marquants**: Notable quotes and memorable phrases
- **Points à Retenir Essentiels**: Essential takeaways organized by theme
- **Conclusion Exhaustive**: Complete synthesis and recommended actions

## Configuration

### OpenAI API Setup

1. Get an API key from [OpenAI](https://platform.openai.com/api-keys)
2. Right-click the extension icon and select "Options"
3. Enter your API key in the configuration page
4. Optionally customize the prompt for different summary styles

### Custom Prompts

You can modify the prompt to change the summary style, language, or structure according to your preferences.

## Technical Details

- **Manifest Version**: 3 (latest Chrome extension standard)
- **AI Model**: GPT-4o-mini (cost-effective and efficient)
- **Token Limit**: 8,000 tokens for comprehensive summaries
- **Transcript Extraction**: Multiple fallback methods for reliable extraction
- **Permissions**: Minimal required permissions (activeTab, storage, scripting)

## Architecture

```
chrome-youtube-summary/
├── manifest.json          # Extension configuration
├── background.js          # Service worker for API calls
├── content.js            # Content script for YouTube integration
├── content.css           # Styling for the popup interface
├── options.html          # Configuration page
├── options.css           # Styling for options page
└── options.js            # Options page functionality
```

## Privacy & Security

- **No Data Collection**: No user data is collected or stored
- **Local Storage Only**: API keys are stored locally in Chrome's sync storage
- **Direct API Calls**: Summaries are generated directly through OpenAI's API
- **No External Servers**: No data passes through third-party servers

## Requirements

- Chrome browser (version 88+)
- OpenAI API key
- YouTube videos with available transcripts

## Limitations

- Only works with YouTube videos that have transcripts available
- Requires a valid OpenAI API key (paid service)
- Summary quality depends on transcript accuracy
- Long videos may hit token limits (8,000 tokens max)

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly
4. Commit your changes: `git commit -m 'Add feature'`
5. Push to the branch: `git push origin feature-name`
6. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

If you encounter issues:

1. Check that the YouTube video has an available transcript
2. Verify your OpenAI API key is correctly configured
3. Check the browser console for error messages
4. Open an issue on GitHub with detailed information

## Changelog

### v1.0.0
- Initial release
- YouTube transcript extraction
- OpenAI integration with French summaries
- Fullscreen popup interface
- Keyboard shortcuts
- Options page for configuration
