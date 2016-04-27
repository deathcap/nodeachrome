'use strict';

// Multi-sandbox support
// Maintains multiple independent execution contexts for JavaScript, using sandboxed iframes (unique origins)

let nextPid = 1;
let iframes = new Map();

// Create a new "userland" sandboxed execution context, previously 'newsb',
// like Unix spawn/exec (close enough) or posix_spawn/system
// TODO: Unix-ish standard Node API to implement instead? process, os? exec? Found it: https://nodejs.org/api/child_process.html exec!
function spawn(argv, env) {
  const container = document.getElementById('userland-processes');

  const iframe = document.createElement('iframe');
  const pid = nextPid;
  nextPid += 1;

  if (!env) env = process.env; // inherit the environment

  iframes.set(pid, iframe);

  iframe.setAttribute('id', 'userland-process-' + pid);
  iframe.setAttribute('src', 'userland.html');
  iframe.addEventListener('load', (event) => {
    console.log('sandbox frame load',pid);
    iframe.contentWindow.postMessage({cmd: '_start', pid: pid, argv, env}, '*');
  });

  container.appendChild(iframe);

  return iframe;
}

// Send a message to the sandboxed iframe, aka the userland
function postUserland(pid, msg) {
  const iframe = iframes.get(pid);
  if (!iframe) throw new Error(`no such sandbox: ${pid}`);

  iframe.contentWindow.postMessage(msg, '*');
}

// Evaluate code within a given sandbox
function evalin(pid, code) {
  postUserland(pid, {cmd: 'eval', code: code});
}

module.exports = {
  spawn,
  evalin,
  postUserland,
};
