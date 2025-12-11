const api = typeof browser !== 'undefined' ? browser : chrome;

let currentDomain = '';
let domainRules = {
  removeSelectors: [],
  cssOverrides: []
};

const elements = {
  currentDomain: document.getElementById('currentDomain'),
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
      cssOverrides: result[currentDomain].cssOverrides || []
    };
  } else {
    domainRules = {
      removeSelectors: [],
      cssOverrides: []
    };
  }
}

async function saveRules() {
  await api.storage.sync.set({ [currentDomain]: domainRules });
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

  if (!selector || !property || !value) return;

  try {
    document.querySelector(selector);
  } catch (e) {
    alert('Invalid CSS-Selector');
    return;
  }

  domainRules.cssOverrides.push({ selector, property, value });
  await saveRules();
  renderCssOverrides();

  elements.cssSelector.value = '';
  elements.cssProperty.value = '';
  elements.cssValue.value = '';
}

async function reloadCurrentTab() {
  const tabs = await api.tabs.query({ active: true, currentWindow: true });
  if (tabs[0]) {
    await api.tabs.reload(tabs[0].id);
    window.close();
  }
}

async function init() {
  currentDomain = await getCurrentDomain();

  if (!currentDomain) {
    elements.currentDomain.textContent = 'Unknown page';
    return;
  }

  elements.currentDomain.textContent = currentDomain;

  await loadRules();
  renderRemoveSelectors();
  renderCssOverrides();

  elements.addRemoveSelector.addEventListener('click', addRemoveSelector);
  elements.newRemoveSelector.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addRemoveSelector();
  });

  elements.addCssOverride.addEventListener('click', addCssOverride);
  elements.cssValue.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addCssOverride();
  });

  elements.reloadPage.addEventListener('click', reloadCurrentTab);
}

document.addEventListener('DOMContentLoaded', init);
