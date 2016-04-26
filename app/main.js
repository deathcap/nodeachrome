'use strict';

require('./ui')(); // wire up button event handlers

// Expose globally for debugging
Object.assign(global, {
  evalsb: evalsb,
});

// Evaluate code in sandboxed frame
function evalsb(code) {
  document.getElementById('sandbox').contentWindow.postMessage({cmd: 'eval', code: code}, '*');
}

require('./send-native.js');
