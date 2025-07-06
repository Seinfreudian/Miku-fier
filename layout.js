const toggle = document.getElementById('toggle');

function getCurrentSiteHostname(callback) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length === 0 || !tabs[0].url) return;
    const url = new URL(tabs[0].url);
    callback(url.hostname);
  });
}

// Load toggle state
getCurrentSiteHostname((hostname) => {
  chrome.storage.local.get([hostname], (result) => {
    toggle.checked = result[hostname] !== false; // default = true
  });
});

// Handle toggle change
toggle.addEventListener('change', () => {
  getCurrentSiteHostname((hostname) => {
    const isEnabled = toggle.checked;
    const obj = {};
    obj[hostname] = isEnabled;

    chrome.storage.local.set(obj, () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tabId = tabs[0]?.id;
        if (!tabId) return;

        // Check if content script is already injected
        chrome.tabs.sendMessage(tabId, { type: "PING" }, (response) => {
          if (chrome.runtime.lastError) {
            // Content script not injected, inject it first
            chrome.scripting.executeScript({
              target: { tabId },
              files: ["miku_pics.js", "content.js"]
            }, () => {
              if (chrome.runtime.lastError) {
                console.error("Failed to inject content script:", chrome.runtime.lastError);
                return;
              }
              // Small delay to ensure script is loaded
              setTimeout(() => {
                chrome.tabs.sendMessage(tabId, {
                  type: isEnabled ? "ENABLE_MIKU" : "DISABLE_MIKU"
                });
              }, 100);
            });
          } else {
            // Content script already injected, send message directly
            chrome.tabs.sendMessage(tabId, {
              type: isEnabled ? "ENABLE_MIKU" : "DISABLE_MIKU"
            });
          }
        });
      });
    });
  });
});