document.addEventListener('DOMContentLoaded', () => {
  // Initialize tabs
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabId = tab.getAttribute('data-tab');
      
      // Remove active class from all tabs and contents
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      
      // Add active class to current tab and content
      tab.classList.add('active');
      document.getElementById(tabId).classList.add('active');
      
      // If saved translations tab is activated, load saved translations
      if (tabId === 'saved') {
        loadSavedTranslations();
      }
    });
  });
  
  // Load API key from storage
  const apiKeyInput = document.getElementById('api-key');
  chrome.storage.sync.get(['apiKey'], (result) => {
    if (result.apiKey) {
      apiKeyInput.value = result.apiKey;
    }
  });
  
  // Save API key to storage
  const saveButton = document.getElementById('save-settings');
  const statusMessage = document.getElementById('settings-status');
  
  saveButton.addEventListener('click', () => {
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
      statusMessage.textContent = 'Please enter your API key';
      statusMessage.className = 'status-message error';
      return;
    }
    
    chrome.storage.sync.set({ apiKey }, () => {
      statusMessage.textContent = 'API key saved successfully!';
      statusMessage.className = 'status-message success';
      
      // Clear message after 3 seconds
      setTimeout(() => {
        statusMessage.textContent = '';
      }, 3000);
    });
  });
});

// Function to load saved translations
function loadSavedTranslations() {
  const savedItemsContainer = document.getElementById('saved-items-container');
  
  chrome.storage.sync.get(['savedTranslations'], (result) => {
    const savedItems = result.savedTranslations || [];
    
    if (savedItems.length === 0) {
      savedItemsContainer.innerHTML = `
        <div class="empty-state">
          <p>No saved translations yet</p>
        </div>
      `;
      return;
    }
    
    // Sort by timestamp (newest first)
    savedItems.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Create HTML for each saved translation
    const itemsHTML = savedItems.map((item, index) => {
      const { word, context, translation, timestamp } = item;
      const date = new Date(timestamp);
      const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
      
      return `
        <div class="saved-item" data-index="${index}">
          <div class="word">${translation.phrase}</div>
          <div class="context">${context}</div>
          <div class="translation">${translation.phraseExplanation}</div>
          <div class="timestamp">${formattedDate}</div>
          <button class="delete-btn" data-index="${index}">Delete</button>
        </div>
      `;
    }).join('');
    
    savedItemsContainer.innerHTML = itemsHTML;
    
    // Add event listeners to delete buttons
    const deleteButtons = document.querySelectorAll('.delete-btn');
    deleteButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const index = parseInt(button.getAttribute('data-index'));
        deleteTranslation(index);
      });
    });
  });
}

// Function to delete a saved translation
function deleteTranslation(index) {
  chrome.storage.sync.get(['savedTranslations'], (result) => {
    const savedItems = result.savedTranslations || [];
    
    if (index >= 0 && index < savedItems.length) {
      savedItems.splice(index, 1);
      
      chrome.storage.sync.set({ savedTranslations: savedItems }, () => {
        loadSavedTranslations();
      });
    }
  });
} 