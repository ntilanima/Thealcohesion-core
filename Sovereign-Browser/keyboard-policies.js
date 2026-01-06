module.exports = {
  global: [
    { key: 'Escape', action: 'block' },
    { key: 'F11', action: 'block' },
    { key: 'Ctrl+R', action: 'block' },
    { key: 'Ctrl+Shift+R', action: 'block' },
    { key: 'Alt+F4', action: 'block' },
    { key: 'Alt+Space', action: 'block' },
    { key: 'Ctrl+W', action: 'block' },
    { key: 'Ctrl+Q', action: 'block' }
    // Meta, Alt+Tab, Ctrl+Alt+Del removed
  ],

  appSpecific: {
    terminal: [
      { key: 'Ctrl+C', action: 'sendToApp' },
      { key: 'Ctrl+V', action: 'sendToApp' }
    ],
    browser: [
      { key: 'Ctrl+T', action: 'block' },
      { key: 'Ctrl+W', action: 'block' }
    ]
  }
}
