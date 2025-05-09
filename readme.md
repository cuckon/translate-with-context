# Translate With Context Browser Extension

A powerful browser extension that translates selected words within their full context, leveraging GPT to provide accurate contextual meanings.

## Features

- **Context-aware Translation**: Right-click on any word to see its meaning within its full sentence context
- **Interactive Panel**: View the original context and translation in a floating panel
- **Word Exploration**: Click on any word in the context to get its translation
- **Powered by GPT**: Uses OpenAI's GPT for accurate, context-aware translations 
- **Custom API Key**: Set and save your own OpenAI API key
- **Study Collection**: Save translations for later review and vocabulary building

## Project Structure

- `manifest.json`: Extension configuration file
- `background.js`: Background script for API calls and context menu handling
- `content.js`: Content script for DOM manipulation and UI handling
- `content.css`: Styles for the translation panel
- `popup.html`: Extension popup UI for settings
- `popup.js`: JavaScript for the popup functionality
- `images/`: Icons for the extension

## Development Setup

1. Clone this repository
2. Open Chrome/Edge/Firefox and navigate to the extensions page
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`
   - Firefox: `about:addons`
3. Enable "Developer mode"
4. Click "Load unpacked" and select this project folder
5. The extension should now be installed in your browser

## API Key Setup

1. Sign up for an OpenAI API key at https://platform.openai.com/
2. Click on the extension icon in your browser toolbar
3. Enter your API key in the settings tab
4. Click "Save Settings"

## Usage

1. Select any text on a webpage
2. Right-click and choose "Translate with Context"
3. View the full sentence and the translation in a floating panel
4. Click other words in the context to translate them instead
5. Save translations for later review by clicking the "Save" button

## Technical Details

The extension uses the OpenAI API with a specialized system prompt that ensures translations consider the full context of the selected text. The system is optimized to:

1. Identify if the selected word is part of a larger phrase
2. Provide accurate translation of the word/phrase in context
3. Translate the full sentence with the relevant part highlighted

## License

MIT

