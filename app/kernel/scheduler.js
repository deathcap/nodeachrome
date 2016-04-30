'use strict';

// Kernel "scheduler" (analogous to OS), manages processes
// Maintains multiple independent execution contexts (processes) for JavaScript, using sandboxed iframes (unique origins)

let nextPid = 1;
let iframes = new Map();

const {createDraggableIframe} = require('./windowing');

class Process {
  constructor() {
    this.state = 'new'; // see https://en.wikipedia.org/wiki/Process_state
    this.pid = nextPid;
    nextPid += 1;

    let {iframe, container} = createDraggableIframe(pid);

    this.iframe = iframe;
    this.container = container;

    iframes.set(pid, iframe);

    const containers = document.getElementById('userland-processes');
    containers.appendChild(container);

    console.log(`new Process: pid=${this.pid}`);
    // process is created in frozen state, can be started with exec()
  }

  exec(argv, env) {
    if (!env) env = global.ENV; // inherit from kernel TODO: per-process inheritance, forking

    this.state = 'waiting'; // awaiting execution
    iframe.setAttribute('src', '/userland/userland.html');
    iframe.addEventListener('load', (event) => {
      console.log('sandbox frame load',pid);
      iframe.contentWindow.postMessage({cmd: '_start', pid: pid, argv, env}, '*');
      this.state = 'running'; // TODO: or should differentiate between frame loaded, and confirmed the frame is running the script? get feedback from _start
    });
  }

  postMessage(msg) {
    if (!this.iframe.contentWindow) throw new Error(`no such process, terminated: ${this.pid}`);

    this.iframe.contentWindow.postMessage(msg, '*');
  }

  terminate() {
    this.iframe.parentNode.removeChild(iframe); // TODO: remove container???
    this.iframes.delete(pid);
    console.log(`Terminated ${pid}`);
    this.state = 'terminated';
    // TODO: reap zombies
  }
}

// Create a new "userland" sandboxed execution context, previously 'newsb',
// like Unix spawn/exec (close enough) or posix_spawn/system
// TODO: Unix-ish standard Node API to implement instead? process, os? exec? Found it: https://nodejs.org/api/child_process.html exec!
function spawn(argv, env) {
  const containers = document.getElementById('userland-processes');

  const pid = nextPid;
  nextPid += 1;

  if (!env) env = global.ENV; // inherit from kernel TODO: per-process inheritance, forking

  let {iframe, container} = createDraggableIframe(pid);

  iframes.set(pid, iframe);

  iframe.setAttribute('src', '/userland/userland.html');
  iframe.addEventListener('load', (event) => {
    console.log('sandbox frame load',pid);
    iframe.contentWindow.postMessage({cmd: '_start', pid: pid, argv, env}, '*');
  });

  container.appendChild(iframe);
  containers.appendChild(container);

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
