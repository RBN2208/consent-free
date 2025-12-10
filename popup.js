const api = typeof browser !== 'undefined' ? browser : chrome;

// Predefined presets (must match predefined-rules.js)
const PRESETS = [
  { id: 'cookiebot', name: 'Cookiebot' },
  { id: 'sourcepoint', name: 'Sourcepoint' },
  { id: 'usercentrics', name: 'Usercentrics' },
  { id: 'onetrust', name: 'OneTrust' },
  { id: 'quantcast', name: 'Quantcast Choice' }
];

let currentDomain = '';
let domainRules = {
  removeSelectors: [],
  cssOverrides: [],
  matchedPresets: [],
  disabledPresets: []
};

const elements = {
  currentDomain: document.getElementById('currentDomain'),
  presetsList: document.getElementById('presetsList'),
  noPresetsMessage: document.getElementById('noPresetsMessage'),
  removeSelectorsList: document.getElementById('removeSelectorsList'),
  newRemoveSelector: document.getElementById('newRemoveSelector'),
  addRemoveSelector: document.getElementById('addRemoveSelector'),
  cssOverridesList: document.getElementById('cssOverridesList'),
  cssSelector: document.getElementById('cssSelector'),
  cssProperty: document.getElementById('cssProperty'),
  cssValue: document.getElementById('cssValue'),
  addCssOverride: document.getElementById('addCssOverride'),
  reloadPage: document.getElementById('reloadPage')
};

async function getCurrentDomain() {
  const tabs = await api.tabs.query({ active: true, currentWindow: true });
  if (tabs[0] && tabs[0].url) {
    try {
      const url = new URL(tabs[0].url);
      return url.hostname;
    } catch (e) {
      return null;
    }
  }
  return null;
}

async function loadRules() {
  const result = await api.storage.sync.get(currentDomain);
  if (result[currentDomain]) {
    domainRules = {
      removeSelectors: result[currentDomain].removeSelectors || [],
      cssOverrides: result[currentDomain].cssOverrides || [],
      matchedPresets: result[currentDomain].matchedPresets || [],
      disabledPresets: result[currentDomain].disabledPresets || []
    };
  } else {
    domainRules = {
      removeSelectors: [],
      cssOverrides: [],
      matchedPresets: [],
      disabledPresets: []
    };
  }
}

async function saveRules() {
  await api.storage.sync.set({ [currentDomain]: domainRules });
}

function renderPresets() {
  const list = elements.presetsList;
  list.innerHTML = '';

  const matchedPresets = domainRules.matchedPresets || [];
  const disabledPresets = domainRules.disabledPresets || [];

  if (matchedPresets.length === 0) {
    elements.noPresetsMessage.style.display = 'block';
    list.style.display = 'none';
    return;
  }

  elements.noPresetsMessage.style.display = 'none';
  list.style.display = 'block';

  matchedPresets.forEach(presetId => {
    const preset = PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    const isDisabled = disabledPresets.includes(presetId);
    const li = document.createElement('li');
    li.className = `preset-item ${isDisabled ? 'disabled' : 'active'}`;
    li.innerHTML = `
      <span class="preset-name">${escapeHtml(preset.name)}</span>
      <span class="preset-status">${isDisabled ? '✗' : '✓'}</span>
      <button class="btn-toggle" data-preset-id="${presetId}">
        ${isDisabled ? 'Enable' : 'Disable'}
      </button>
    `;
    list.appendChild(li);
  });

  list.querySelectorAll('.btn-toggle').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const presetId = e.target.dataset.presetId;
      await togglePreset(presetId);
    });
  });
}

async function togglePreset(presetId) {
  const index = domainRules.disabledPresets.indexOf(presetId);
  if (index === -1) {
    domainRules.disabledPresets.push(presetId);
  } else {
    domainRules.disabledPresets.splice(index, 1);
  }
  await saveRules();
  renderPresets();
}

function renderRemoveSelectors() {
  const list = elements.removeSelectorsList;
  list.innerHTML = '';

  if (domainRules.removeSelectors.length === 0) {
    list.innerHTML = '<li class="empty-message">No selectors defined</li>';
    return;
  }

  domainRules.removeSelectors.forEach((selector, index) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="rule-text">${escapeHtml(selector)}</span>
      <button class="btn-delete" data-index="${index}">×</button>
    `;
    list.appendChild(li);
  });

  list.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const index = parseInt(e.target.dataset.index);
      domainRules.removeSelectors.splice(index, 1);
      await saveRules();
      renderRemoveSelectors();
    });
  });
}

function renderCssOverrides() {
  const list = elements.cssOverridesList;
  list.innerHTML = '';

  if (domainRules.cssOverrides.length === 0) {
    list.innerHTML = '<li class="empty-message">No overrides defined</li>';
    return;
  }

  domainRules.cssOverrides.forEach((override, index) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="rule-text">${escapeHtml(override.selector)} { ${escapeHtml(override.property)}: ${escapeHtml(override.value)} }</span>
      <button class="btn-delete" data-index="${index}">×</button>
    `;
    list.appendChild(li);
  });

  list.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const index = parseInt(e.target.dataset.index);
      domainRules.cssOverrides.splice(index, 1);
      await saveRules();
      renderCssOverrides();
    });
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

async function addRemoveSelector() {
  const selector = elements.newRemoveSelector.value.trim();
  if (!selector) return;

  try {
    document.querySelector(selector);
  } catch (e) {
    alert('Invalid CSS-Selector');
    return;
  }

  if (!domainRules.removeSelectors.includes(selector)) {
    domainRules.removeSelectors.push(selector);
    await saveRules();
    renderRemoveSelectors();
  }

  elements.newRemoveSelector.value = '';
}

async function addCssOverride() {
  const selector = elements.cssSelector.value.trim();
  const property = elements.cssProperty.value.trim();
  const value = elements.cssValue.value.trim();

  if (!selector || !property || !value) {
    alert('Bitte alle Felder ausfüllen');
    return;
  }

  try {
    document.querySelector(selector);
  } catch (e) {
    alert('Ungültiger CSS-Selector');
    return;
  }

  domainRules.cssOverrides.push({ selector, property, value });
  await saveRules();
  renderCssOverrides();

  elements.cssSelector.value = '';
  elements.cssProperty.value = '';
  elements.cssValue.value = '';
}

async function reloadCurrentPage() {
  const tabs = await api.tabs.query({ active: true, currentWindow: true });
  if (tabs[0]) {
    await api.tabs.reload(tabs[0].id);
    window.close();
  }
}

elements.addRemoveSelector.addEventListener('click', addRemoveSelector);
elements.newRemoveSelector.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') addRemoveSelector();
});

elements.addCssOverride.addEventListener('click', addCssOverride);
elements.cssValue.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') addCssOverride();
});

elements.reloadPage.addEventListener('click', reloadCurrentPage);

async function init() {
  currentDomain = await getCurrentDomain();

  if (!currentDomain) {
    elements.currentDomain.textContent = 'No valid url';
    return;
  }

  elements.currentDomain.textContent = currentDomain;
  await loadRules();
  renderPresets();
  renderRemoveSelectors();
  renderCssOverrides();
}

init();
