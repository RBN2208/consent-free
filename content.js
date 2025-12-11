const api = typeof browser !== 'undefined' ? browser : chrome;

function getCurrentDomain() {
  return window.location.hostname;
}

function removeElements(selectors) {
  selectors.forEach(selector => {
    try {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => element.remove());
    } catch (e) {
      console.warn(`Consent Free: invalid selector "${selector}"`, e);
    }
  });
}

function injectCssOverrides(cssOverrides) {
  if (cssOverrides.length === 0) return;
  if (!document.head) return;

  const existingStyle = document.getElementById('consent-free-styles');
  if (existingStyle) {
    existingStyle.remove();
  }

  const style = document.createElement('style');
  style.id = 'consent-free-styles';

  const cssRules = cssOverrides.map(override => {
    return `${override.selector} { ${override.property}: ${override.value} !important; }`;
  }).join('\n');

  style.textContent = cssRules;
  document.head.appendChild(style);
}

function setupMutationObserver(selectors) {
  if (selectors.length === 0) return;
  if (!document.body) return;

  const observer = new MutationObserver((mutations) => {
    let shouldCheck = false;

    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        shouldCheck = true;
        break;
      }
    }

    if (shouldCheck) {
      removeElements(selectors);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

async function applyRules() {
  const domain = getCurrentDomain();

  try {
    const result = await api.storage.sync.get(domain);
    const domainRules = result[domain] || {};

    const removeSelectors = domainRules.removeSelectors || [];
    const cssOverrides = domainRules.cssOverrides || [];

    if (removeSelectors.length > 0) {
      removeElements(removeSelectors);
      setupMutationObserver(removeSelectors);
    }

    if (cssOverrides.length > 0) {
      injectCssOverrides(cssOverrides);
    }
  } catch (e) {
    console.error('Consent Free: Error while loading rules', e);
  }
}

async function init() {
  await applyRules();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}