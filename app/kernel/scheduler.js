'use strict';

// Kernel "scheduler" (analogous to OS), manages processes
// Maintains multiple independent execution contexts (processes) for JavaScript, using sandboxed iframes (unique origins)

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

  if (!env) env = global.ENV; // inherit from kernel TODO: per-process inheritance, forking

  iframes.set(pid, iframe);

  iframe.setAttribute('id', 'userland-process-' + pid);
  iframe.setAttribute('src', '/userland/userland.html');

  iframe.setAttribute('style', 'border-width: 5px;'); // something to hang onto to drag
  iframe.setAttribute('draggable', 'true'); // allow picking it up TODO: allow dropping

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
  if (!iframe) throw new Error(`no such process: ${pid}`);
  if (!iframe.contentWindow) throw new Error(`no such process, terminated: ${pid}`);

  iframe.contentWindow.postMessage(msg, '*');
}

// Evaluate code within a given sandbox
function evalin(pid, code) {
  postUserland(pid, {cmd: 'eval', code: code});
}

function kill(pid, signal) {
  //TODO: SIGTERM etc. postUserland(pid, {cmd: 'signal', signal: signal});
  //if (signal === 'SIGKILL') {
  
    const iframe = iframes.get(pid);
    iframe.parentNode.removeChild(iframe);
    iframes.delete(pid);
    console.log(`Killed ${pid}`);

  //}
}

module.exports = {
  spawn,
  evalin,
  postUserland,
  kill,
};
