'use strict';

// Multi-sandbox support
// Maintains multiple independent execution contexts for JavaScript, using sandboxed iframes (unique origins)

let nextSbID = 1;
let iframes = new Map();

// Create a new sandboxed execution context
function newsb(argv, env) {
  const container = document.getElementById('sandboxes');

  const iframe = document.createElement('iframe');
  const sbID = nextSbID;
  nextSbID += 1;

  if (!env) env = process.env; // inherit the environment

  iframes.set(sbID, iframe);

  iframe.setAttribute('id', 'sandbox-' + sbID);
  iframe.setAttribute('src', 'sandbox.html');
  iframe.addEventListener('load', (event) => {
    console.log('sandbox frame load',sbID);
    iframe.contentWindow.postMessage({cmd: '_start', sbID: sbID, argv, env}, '*');
  });

  container.appendChild(iframe);

  return iframe;
}

// Send a message to the sandboxed iframe
function postSandbox(sbID, msg) {
  const iframe = iframes.get(sbID);
  if (!iframe) throw new Error(`no such sandbox: ${sbID}`);

  iframe.contentWindow.postMessage(msg, '*');
}

// Evaluate code within a given sandbox
function evalin(sbID, code) {
  postSandbox(sbID, {cmd: 'eval', code: code});
}

module.exports = {
  newsb,
  evalin,
  postSandbox,
};
