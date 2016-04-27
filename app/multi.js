'use strict';

// Multi-sandbox support
// Maintains multiple independent execution contexts for JavaScript, using sandboxed iframes (unique origins)

let nextPid = 1;
let iframes = new Map();

// Create a new sandboxed execution context, previously 'newsb', like Unix spawn/exec (close enough) or posix_spawn/system
function spawn(argv, env) {
  const container = document.getElementById('sandboxes');

  const iframe = document.createElement('iframe');
  const pid = nextPid;
  nextPid += 1;

  if (!env) env = process.env; // inherit the environment

  iframes.set(pid, iframe);

  iframe.setAttribute('id', 'sandbox-' + pid);
  iframe.setAttribute('src', 'sandbox.html');
  iframe.addEventListener('load', (event) => {
    console.log('sandbox frame load',pid);
    iframe.contentWindow.postMessage({cmd: '_start', pid: pid, argv, env}, '*');
  });

  container.appendChild(iframe);

  return iframe;
}

// Send a message to the sandboxed iframe
function postSandbox(pid, msg) {
  const iframe = iframes.get(pid);
  if (!iframe) throw new Error(`no such sandbox: ${pid}`);

  iframe.contentWindow.postMessage(msg, '*');
}

// Evaluate code within a given sandbox
function evalin(pid, code) {
  postSandbox(pid, {cmd: 'eval', code: code});
}

module.exports = {
  spawn,
  evalin,
  postSandbox,
};
