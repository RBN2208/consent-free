const api = typeof browser !== 'undefined' ? browser : chrome;

let hasAppliedPresets = false;
let appliedPresetIds = new Set();

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
  document.head && document.head.appendChild(style);
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

function checkPresetMatch(preset) {
  for (const selector of preset.removeSelectors) {
    try {
      if (document.querySelector(selector)) {
        return true;
      }
    } catch (e) {
      console.warn(`Consent Free: invalid preset selector "${selector}"`, e);
    }
  }
  return false;
}

function detectMatchingPresets() {
  const presets = window.CONSENT_FREE_PRESETS || [];
  const matchedPresets = [];

  for (const preset of presets) {
    if (checkPresetMatch(preset)) {
      matchedPresets.push(preset.id);
    }
  }

  return matchedPresets;
}

function getActivePresets(matchedPresets, disabledPresets) {
  const presets = window.CONSENT_FREE_PRESETS || [];
  return presets.filter(preset =>
    matchedPresets.includes(preset.id) && !disabledPresets.includes(preset.id)
  );
}

function collectPresetRules(activePresets) {
  const removeSelectors = [];
  const cssOverrides = [];

  for (const preset of activePresets) {
    removeSelectors.push(...preset.removeSelectors);
    cssOverrides.push(...preset.cssOverrides);
  }

  return { removeSelectors, cssOverrides };
}

async function applyRules(matchedPresets, domainRules, domain) {
  const disabledPresets = domainRules.disabledPresets || [];

  // Store matched presets for popup display
  if (matchedPresets.length > 0) {
    const existingMatched = domainRules.matchedPresets || [];
    const allMatched = [...new Set([...existingMatched, ...matchedPresets])];
    domainRules.matchedPresets = allMatched;
    await api.storage.sync.set({ [domain]: domainRules });
  }

  // Get active presets (matched but not disabled)
  const activePresets = getActivePresets(matchedPresets, disabledPresets);
  const presetRules = collectPresetRules(activePresets);

  // Combine preset rules with custom rules
  const customRemoveSelectors = domainRules.removeSelectors || [];
  const customCssOverrides = domainRules.cssOverrides || [];

  const allRemoveSelectors = [...presetRules.removeSelectors, ...customRemoveSelectors];
  const allCssOverrides = [...presetRules.cssOverrides, ...customCssOverrides];

  if (allRemoveSelectors.length > 0) {
    removeElements(allRemoveSelectors);
    setupMutationObserver(allRemoveSelectors);
  }

  if (allCssOverrides.length > 0) {
    injectCssOverrides(allCssOverrides);
  }

  // Track applied presets
  matchedPresets.forEach(id => appliedPresetIds.add(id));
}

async function checkAndApplyPresets() {
  const domain = getCurrentDomain();

  try {
    const result = await api.storage.sync.get(domain);
    let domainRules = result[domain] || {};

    // Detect matching presets
    const matchedPresets = detectMatchingPresets();

    // Filter out already applied presets
    const newPresets = matchedPresets.filter(id => !appliedPresetIds.has(id));

    if (newPresets.length > 0 || !hasAppliedPresets) {
      await applyRules(matchedPresets, domainRules, domain);
      hasAppliedPresets = true;
    }
  } catch (e) {
    console.error('Consent Free: Error while loading rules', e);
  }
}

function setupPresetDetectionObserver() {
  // Check periodically for the first few seconds (consent banners often load late)
  let checkCount = 0;
  const maxChecks = 20;
  const checkInterval = setInterval(() => {
    checkAndApplyPresets();
    checkCount++;
    if (checkCount >= maxChecks) {
      clearInterval(checkInterval);
    }
  }, 500);

  // Also observe DOM changes for dynamically added consent banners
  const observer = new MutationObserver(() => {
    checkAndApplyPresets();
  });

  if (document.body) {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
}

async function init() {
  // Initial check
  setTimeout(async () => {
    await checkAndApplyPresets();

    // Setup continuous detection for late-loading consent banners
    setupPresetDetectionObserver();
  }, 500)
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}