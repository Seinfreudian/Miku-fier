let mikuEnabled = true;
let mainObserver = null;
let imageObservers = new Map();

function getMikuUrl() {
  const index = Math.floor(Math.random() * miku_pics.length);
  return chrome.runtime.getURL(miku_pics[index]);
}

function isImageAlreadyMikufied(img) {
  return img.hasAttribute('data-mikufied');
}

function mikufyImage(img) {
  if (!mikuEnabled || isImageAlreadyMikufied(img)) return;
  
  // Store original src
  const originalSrc = img.src;
  const mikuUrl = getMikuUrl();
  
  // Mark as mikufied and store original
  img.setAttribute('data-original-src', originalSrc);
  img.setAttribute('data-mikufied', 'true');
  img.src = mikuUrl;
  
  // Create individual observer to prevent src changes
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'src') {
        if (mikuEnabled && img.src !== mikuUrl) {
          img.src = mikuUrl;
        }
      }
    });
  });
  
  observer.observe(img, { 
    attributes: true, 
    attributeFilter: ['src'] 
  });
  
  imageObservers.set(img, observer);
}

function unmikufyImage(img) {
  if (!isImageAlreadyMikufied(img)) return;
  
  const originalSrc = img.getAttribute('data-original-src');
  if (originalSrc) {
    img.src = originalSrc;
  }
  
  img.removeAttribute('data-mikufied');
  img.removeAttribute('data-original-src');
  
  // Clean up observer
  const observer = imageObservers.get(img);
  if (observer) {
    observer.disconnect();
    imageObservers.delete(img);
  }
}

function processAllImages() {
  const images = document.querySelectorAll('img');
  images.forEach(img => {
    if (mikuEnabled) {
      mikufyImage(img);
    } else {
      unmikufyImage(img);
    }
  });
}

function startObserving() {
  if (mainObserver) {
    mainObserver.disconnect();
  }
  
  mainObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      // Handle added nodes
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // Check if the added node is an img
          if (node.tagName === 'IMG') {
            if (mikuEnabled) {
              mikufyImage(node);
            }
          }
          // Check for img elements within the added node
          else if (node.querySelectorAll) {
            const imgs = node.querySelectorAll('img');
            imgs.forEach(img => {
              if (mikuEnabled) {
                mikufyImage(img);
              }
            });
          }
        }
      });
      
      // Handle removed nodes (cleanup)
      mutation.removedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          if (node.tagName === 'IMG') {
            const observer = imageObservers.get(node);
            if (observer) {
              observer.disconnect();
              imageObservers.delete(node);
            }
          } else if (node.querySelectorAll) {
            const imgs = node.querySelectorAll('img');
            imgs.forEach(img => {
              const observer = imageObservers.get(img);
              if (observer) {
                observer.disconnect();
                imageObservers.delete(img);
              }
            });
          }
        }
      });
    });
  });
  
  mainObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
}

function stopObserving() {
  if (mainObserver) {
    mainObserver.disconnect();
    mainObserver = null;
  }
  
  // Clean up all image observers
  imageObservers.forEach(observer => observer.disconnect());
  imageObservers.clear();
}

function enableMiku() {
  mikuEnabled = true;
  processAllImages();
  startObserving();
  console.log('✅ Miku-fier enabled');
}

function disableMiku() {
  mikuEnabled = false;
  processAllImages(); // This will unmikufy all images
  stopObserving();
  console.log('🚫 Miku-fier disabled');
}

// Message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'ENABLE_MIKU') {
    enableMiku();
  } else if (message.type === 'DISABLE_MIKU') {
    disableMiku();
  } else if (message.type === 'PING') {
    sendResponse({ status: 'alive' });
  }
});

// Initialize based on storage
const hostname = window.location.hostname;

chrome.storage.local.get([hostname], (result) => {
  const enabled = result[hostname];
  
  if (enabled === false) {
    disableMiku();
  } else {
    enableMiku();
  }
});

// Handle page load completion
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (mikuEnabled) {
      processAllImages();
    }
  });
} else {
  // Document already loaded
  if (mikuEnabled) {
    processAllImages();
  }
}