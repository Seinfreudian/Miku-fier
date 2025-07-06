const toggle = document.getElementById('toggle');

function getCurrentSiteHostname(callback) {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    if (tabs.length === 0) return;
    const url = new URL(tabs[0].url);
    callback(url.hostname);
  });
}

// Load toggle state for current site
getCurrentSiteHostname((hostname) => {
  chrome.storage.local.get([hostname], (result) => {
    toggle.checked = result[hostname] !== false; // default enabled
  });
});

// Save toggle state when changed
toggle.addEventListener('change', () => {
  getCurrentSiteHostname((hostname) => {
    let obj = {};
    obj[hostname] = toggle.checked;
    chrome.storage.local.set(obj);
  });
});
