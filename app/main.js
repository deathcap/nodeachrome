'use strict';

require('./ui')(); // wire up button event handlers

// Expose globally for debugging
Object.assign(global, {
  evalsb: evalsb,
  newsb: newsb,
  evalin: evalin,
});

// Evaluate code in sandboxed frame
function evalsb(code) {
  document.getElementById('sandbox-0').contentWindow.postMessage({cmd: 'eval', code: code}, '*');
}

// Create a new sandboxed execution context: TODO: use only this, remove hardcoded sandbox-0
let nextSbID = 1;
function newsb() {
  const container = document.getElementById('sandboxes');

  const iframe = document.createElement('iframe');
  iframe.setAttribute('id', 'sandbox-' + nextSbID);
  iframe.setAttribute('src', 'sandbox.html');
  container.appendChild(iframe);

  iframe.contentWindow.postMessage({cmd: 'ping', sbID: nextSbID}, '*');

  nextSbID += 1;

  return iframe;
}

function evalin(n, code) {
  const iframe = document.getElementById('sandbox-' + n);
  if (!iframe) throw new Error(`no such sandbox: ${n}`);

  iframe.contentWindow.postMessage({cmd: 'eval', code: code}, '*');
}

require('./send-native.js');
