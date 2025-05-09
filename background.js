// Initialize context menu item when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "translateWithContext",
    title: "Translate with Context",
    contexts: ["selection"]
  });
});

// Listen for context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "translateWithContext") {
    // Send selected text to content script
    chrome.tabs.sendMessage(tab.id, {
      action: "translate",
      text: info.selectionText
    });
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "translateAPI") {
    // Get API key from storage
    chrome.storage.sync.get(["apiKey"], async (result) => {
      if (!result.apiKey) {
        sendResponse({ error: "API key not set. Please set your OpenAI API key in the extension settings." });
        return;
      }
      
      try {
        const translation = await callOpenAIAPI(request.word, request.context, result.apiKey);
        sendResponse({ translation });
      } catch (error) {
        sendResponse({ error: error.message });
      }
    });
    
    // Return true to indicate we will respond asynchronously
    return true;
  }
});

// Function to call OpenAI API
async function callOpenAIAPI(word, context, apiKey) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `你是一个英语老师，我给定一个单词，以及英语语句context，你用JSON的形式给出:

1. 如果用户指定的词语是Context中更加完整的短语的一部分，则解释此完整短语在context中的中文含义。如果不是，则直接是单词在context中的含义。
2. 整句话的中文翻译，并且把单词短语对应的部分标粗（使用markdown语法）

目的是以帮助读者理解和学习英语。

# Output Format

请用JSON输出，格式如下：
{
 "phrase": "完整短语或者原单词", 
  "phraseExplanation": "完整短语的中文含义或单词的中文含义",
  "sentenceTranslation": "整句的流畅翻译，其中短语或单词对应部分用**标记**"
}

# 注意：
- sentenceTranslation 中不要过度标记，你要准确标记原单词或短语对应部分
- sentenceTranslation 要流畅，不需要把phraseExplanation对应的部分生硬的嵌入进来，而是先以sentenceTranslation  流畅为主，然后标记 phrase对应部分翻译`
        },
        {
          role: "user",
          content: `word: ${word}\ncontext: "${context}"`
        }
      ]
    })
  });

  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error.message || "Error calling OpenAI API");
  }
  
  try {
    return JSON.parse(data.choices[0].message.content);
  } catch (e) {
    throw new Error("Failed to parse translation response");
  }
} 