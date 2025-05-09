// Initialize variables
let translationPanel = null;
let savedTranslations = [];

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "translate") {
    const selectedText = request.text;
    const contextSentence = getContextSentence(selectedText);
    
    if (contextSentence) {
      translateWord(selectedText, contextSentence);
    } else {
      showNotification("Could not find context for selected text");
    }
  }
});

// Find the sentence containing the selected text
function getContextSentence(selectedText) {
  const selection = window.getSelection();
  if (!selection.rangeCount) return null;
  
  const range = selection.getRangeAt(0);
  const startNode = range.startContainer;
  
  // Get the paragraph or closest block element
  let container = startNode;
  while (container && !isBlockElement(container)) {
    container = container.parentElement;
  }
  
  if (!container) return null;
  
  // Extract the text content
  const fullText = container.textContent;
  
  // Split into sentences (simple implementation)
  const sentences = fullText.split(/(?<=[.!?])\s+/);
  
  // Find the sentence containing the selected text
  for (const sentence of sentences) {
    if (sentence.includes(selectedText)) {
      return sentence.trim();
    }
  }
  
  // If no specific sentence found, return a reasonable context around the selection
  return fullText.substring(
    Math.max(0, fullText.indexOf(selectedText) - 100),
    Math.min(fullText.length, fullText.indexOf(selectedText) + selectedText.length + 100)
  ).trim();
}

// Check if an element is a block element
function isBlockElement(element) {
  if (element.nodeType !== Node.ELEMENT_NODE) return false;
  
  const display = window.getComputedStyle(element).display;
  return display === 'block' || display === 'flex' || display === 'grid';
}

// Translate the selected word with context
function translateWord(word, context) {
  showLoadingPanel(word, context);
  
  chrome.runtime.sendMessage(
    { action: "translateAPI", word, context },
    (response) => {
      if (response.error) {
        showErrorInPanel(response.error);
      } else {
        updatePanelWithTranslation(word, context, response.translation);
      }
    }
  );
}

// Create and show the translation panel with loading state
function showLoadingPanel(word, context) {
  if (translationPanel) {
    document.body.removeChild(translationPanel);
  }
  
  translationPanel = document.createElement('div');
  translationPanel.className = 'twc-translation-panel';
  translationPanel.innerHTML = `
    <div class="twc-header">
      <h3>Translate With Context</h3>
      <div class="twc-controls">
        <button class="twc-save-btn" disabled>Save</button>
        <button class="twc-close-btn">×</button>
      </div>
    </div>
    <div class="twc-content">
      <div class="twc-original">
        <div class="twc-context">${context}</div>
      </div>
      <div class="twc-translation">
        <div class="twc-loading">Translating...</div>
      </div>
    </div>
  `;
  
  // Position the panel near the selection
  const selection = window.getSelection();
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  
  translationPanel.style.left = `${window.scrollX + rect.left}px`;
  translationPanel.style.top = `${window.scrollY + rect.bottom + 10}px`;
  
  // Add event listeners
  translationPanel.querySelector('.twc-close-btn').addEventListener('click', () => {
    document.body.removeChild(translationPanel);
    translationPanel = null;
  });
  
  document.body.appendChild(translationPanel);
  
  // Make panel draggable
  makeDraggable(translationPanel);
}

// Update the panel with translation results
function updatePanelWithTranslation(word, context, translation) {
  if (!translationPanel) return;
  
  const highlightedContext = highlightWordInContext(context, word, translation.phrase);
  
  translationPanel.querySelector('.twc-context').innerHTML = highlightedContext;
  
  const translationContent = translationPanel.querySelector('.twc-translation');
  translationContent.innerHTML = `
    <div class="twc-phrase">
      <strong>${translation.phrase}</strong>
      <div class="twc-explanation">${translation.phraseExplanation}</div>
    </div>
    <div class="twc-sentence">${translation.sentenceTranslation}</div>
  `;
  
  // Enable save button
  const saveBtn = translationPanel.querySelector('.twc-save-btn');
  saveBtn.disabled = false;
  saveBtn.addEventListener('click', () => {
    saveTranslation(word, context, translation);
    saveBtn.textContent = 'Saved!';
    saveBtn.disabled = true;
  });
  
  // Add click handlers to words in the context
  const wordElements = translationPanel.querySelectorAll('.twc-context .twc-word');
  wordElements.forEach(wordElement => {
    wordElement.addEventListener('click', () => {
      translateWord(wordElement.textContent, context);
    });
  });
}

// Highlight the selected word in the context
function highlightWordInContext(context, word, phrase) {
  const phraseRegex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  
  // Split the context into words
  return context.replace(/\b\w+\b/g, match => {
    if (phrase.toLowerCase().includes(match.toLowerCase())) {
      return `<span class="twc-phrase-part">${match}</span>`;
    } else {
      return `<span class="twc-word">${match}</span>`;
    }
  });
}

// Show error message in the panel
function showErrorInPanel(errorMessage) {
  if (!translationPanel) return;
  
  const translationContent = translationPanel.querySelector('.twc-translation');
  translationContent.innerHTML = `
    <div class="twc-error">
      <p>${errorMessage}</p>
      <p>Please check that your OpenAI API key is correctly set in the extension settings.</p>
    </div>
  `;
}

// Make an element draggable
function makeDraggable(element) {
  const header = element.querySelector('.twc-header');
  let isDragging = false;
  let offsetX, offsetY;
  
  header.addEventListener('mousedown', (e) => {
    isDragging = true;
    offsetX = e.clientX - element.getBoundingClientRect().left;
    offsetY = e.clientY - element.getBoundingClientRect().top;
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    element.style.left = `${e.clientX - offsetX}px`;
    element.style.top = `${e.clientY - offsetY}px`;
  });
  
  document.addEventListener('mouseup', () => {
    isDragging = false;
  });
}

// Show a notification
function showNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'twc-notification';
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('twc-fade-out');
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 500);
  }, 3000);
}

// Save translation to storage
function saveTranslation(word, context, translation) {
  const savedItem = {
    word,
    context,
    translation,
    timestamp: new Date().toISOString()
  };
  
  // Get existing saved translations
  chrome.storage.sync.get(['savedTranslations'], (result) => {
    let saved = result.savedTranslations || [];
    
    // Add new translation
    saved.push(savedItem);
    
    // Store updated translations
    chrome.storage.sync.set({ savedTranslations: saved });
  });
} 