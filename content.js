function getMikuUrl() {
  const index = Math.floor(Math.random() * miku_pics.length);
  return chrome.runtime.getURL(miku_pics[index]);
}

function replaceImage(img) {
  if (!img.hasAttribute('data-mikufied')) {
    const mikuUrl = getMikuUrl();
    img.setAttribute('data-original-src', img.src);
    img.setAttribute('data-mikufied', 'true');
    img.src = mikuUrl;

    // miku-fied for dynamic DOM updates
    const observer = new MutationObserver(() => {
      if (img.src !== mikuUrl) {
        img.src = mikuUrl;
      }
    });
    observer.observe(img, { attributes: true, attributeFilter: ['src'] });
  }
}

function replaceAllImages() {
  const imgs = document.querySelectorAll("img");
  imgs.forEach(replaceImage);
}

function observeNewImages() {
  const observer = new MutationObserver((mutations) => {
    for (let mutation of mutations) {
      for (let node of mutation.addedNodes) {
        if (node.nodeType === 1) {
          if (node.tagName === "IMG") {
            replaceImage(node);
          } else {
            const imgs = node.querySelectorAll?.("img");
            imgs?.forEach(replaceImage);
          }
        }
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// === ⛔️ MAIN GUARD: Only run if site is enabled ===
const hostname = window.location.hostname;

chrome.storage.local.get([hostname], (result) => {
  const enabled = result[hostname];
  
  // default to ON if not explicitly disabled
  if (enabled === false) {
    console.log("🚫 Miku-fier is disabled on this site.");
    return;
  }

  console.log("✅ Miku-fier is enabled on this site.");
  replaceAllImages();
  observeNewImages();
});
