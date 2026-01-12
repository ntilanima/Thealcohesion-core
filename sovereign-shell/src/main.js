import { Terminal } from 'xterm';
import { WebglAddon } from 'xterm-addon-webgl';
import 'xterm/css/xterm.css';

const term = new Terminal({
  theme: { background: '#1a1a1a' },
  cursorBlink: true
});

const container = document.getElementById('terminal-container');
term.open(container);

// This is the "Zero-Lag" secret
const webglAddon = new WebglAddon();
term.loadAddon(webglAddon);

term.write('Welcome to your Custom OS Runtime \r\n$ ');