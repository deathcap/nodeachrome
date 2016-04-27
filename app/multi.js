'use strict';

// Multi-sandbox support
// Maintains multiple independent execution contexts for JavaScript, using sandboxed iframes (unique origins)

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

// Evaluate code within a given sandbox
function evalin(n, code) {
  const iframe = document.getElementById('sandbox-' + n);
  if (!iframe) throw new Error(`no such sandbox: ${n}`);

  iframe.contentWindow.postMessage({cmd: 'eval', code: code}, '*');
}

// Send a message to the sandboxed iframe
// TODO: track which sandbox sends us, send back instead of hardcoding sandbox-0
function postSandbox(msg, sbID) {
  const iframe = document.getElementById('sandbox-' + sbID); // TODO: maintain map of sbID -> iframes, populate in newsb(), instead of DOM lookup
  const targetOrigin = '*';
  iframe.contentWindow.postMessage(msg, targetOrigin);
}


module.exports = {
  newsb,
  evalin,
  postSandbox,
};
