// filepath: /Users/robinsteinhauser/development/private/consent-free/predefined-rules.js
// Predefined rules for popular cookie consent managers
// This file can be extended with additional consent managers

window.CONSENT_FREE_PRESETS = [
  {
    id: 'cookiebot',
    name: 'Cookiebot',
    removeSelectors: [
      '#CybotCookiebotDialog',
      '#CybotCookiebotDialogBodyUnderlay'
    ],
    cssOverrides: [
      { selector: 'body', property: 'overflow', value: 'auto' }
    ]
  },
  {
    id: 'sourcepoint',
    name: 'Sourcepoint',
    removeSelectors: [
      '[id^="sp_message_container_"]',
      '.sp-message-open'
    ],
    cssOverrides: [
      { selector: 'body', property: 'overflow', value: 'auto' }
    ]
  },
  {
    id: 'usercentrics',
    name: 'Usercentrics',
    removeSelectors: [
      '#usercentrics-root',
      '#uc-overflow-style'
    ],
    cssOverrides: [
      { selector: 'body', property: 'overflow', value: 'auto' },
      { selector: 'body.overflowHidden', property: 'overflow', value: 'auto' }
    ]
  },
  {
    id: 'onetrust',
    name: 'OneTrust',
    removeSelectors: [
      '#onetrust-consent-sdk',
      '#onetrust-banner-sdk',
      '.onetrust-pc-dark-filter'
    ],
    cssOverrides: [
      { selector: 'body', property: 'overflow', value: 'auto' }
    ]
  },
  {
    id: 'quantcast',
    name: 'Quantcast Choice',
    removeSelectors: [
      '.qc-cmp2-container',
      '#qc-cmp2-main'
    ],
    cssOverrides: [
      { selector: 'body', property: 'overflow', value: 'auto' }
    ]
  }
];

