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

// Create a new sandboxed execution context
let nextSbID = 0;
function newsb() {
  const container = document.getElementById('sandboxes');

  const iframe = document.createElement('iframe');
  const sbID = nextSbID;
  nextSbID += 1;

  iframe.setAttribute('id', 'sandbox-' + sbID);
  iframe.setAttribute('src', 'sandbox.html');
  iframe.addEventListener('load', (event) => {
    console.log('sandbox frame load',sbID);
    iframe.contentWindow.postMessage({cmd: 'ping', sbID: sbID}, '*');
  });

  container.appendChild(iframe);

  return iframe;
}

function evalin(n, code) {
  const iframe = document.getElementById('sandbox-' + n);
  if (!iframe) throw new Error(`no such sandbox: ${n}`);

  iframe.contentWindow.postMessage({cmd: 'eval', code: code}, '*');
}

require('./send-native.js');

console.log('creating initial sandbox');
newsb(); // when page loads, create first sandbox
