'use strict';

// Kernel "scheduler" (analogous to OS), manages processes
// Maintains multiple independent execution contexts (processes) for JavaScript, using sandboxed iframes

let nextPid = 1;
let processes = new Map();
let sources = new Map();

const {createDraggableIframe} = require('./windowing');

class Process {
  // Create a new "userland" sandboxed execution context (= process)
  constructor() {
    this.state = 'new'; // see https://en.wikipedia.org/wiki/Process_state
    this.pid = nextPid;
    nextPid += 1;

    let {iframe, container} = createDraggableIframe(this.pid);

    this.iframe = iframe;
    this.container = container;

    processes.set(this.pid, this);

    const containers = document.getElementById('userland-processes');
    containers.appendChild(container);

    console.log(`new Process pid=${this.pid}`);
    // process is created in frozen state, can be started with exec()
  }

  // Execute code with arguments and environment, like Unix fork/exec or posix_spawn/system
  exec(argv, env) {
    console.log(`Process exec ${this.pid}, argv ${JSON.stringify(argv)}, env ${JSON.stringify(env)}`);

    if (!env) env = global.ENV; // inherit from kernel TODO: per-process inheritance, forking

    // save own independent copy
    this.argv = JSON.parse(JSON.stringify(argv));
    this.env = JSON.parse(JSON.stringify(env));

    this.state = 'waiting'; // awaiting execution
    this.iframe.setAttribute('src', '/userland/userland.html');
    this.iframe.addEventListener('load', (event) => {
      console.log('sandbox frame load',this.pid);

      sources.set(this.iframe.contentWindow, this);

      this.iframe.contentWindow.postMessage({cmd: '_start', pid: this.pid, argv: this.argv, env: this.env}, '*');
      this.state = 'ready'; // ready until process confirms it started by posting reply back to _start: 'started'
    });
    // TODO: add path, to require and/or readFile to execute and run
  }

  // IPC
  postMessage(msg) {
    if (!this.iframe.contentWindow) throw new Error(`unable to send to process, no iframe content: ${this.pid}`);

    this.iframe.contentWindow.postMessage(msg, '*');
  }

  terminate() {
    this.container.parentNode.removeChild(this.container);
    processes.delete(this.pid);
    console.log(`Terminated ${this.pid}`);
    this.state = 'terminated';
    // TODO: reap zombies
  }

  static getFromPid(pid) {
    return processes.get(pid);
  }

  static getFromSource(source) {
    return sources.get(source);
  }
}

window.addEventListener('message', (event) => {
  if (event.data.cmd === 'started') {
    const proc = Process.getFromSource(event.source);
    if (!proc) throw new Error(`started process not found: ${event.data}`);

    proc.state = 'running';
  } else if (event.data.cmd === 'kill') {
    const pid = event.data.pid;
    const signal = event.data.signal;

    const sourceProcess = Process.getFromSource(event.source);

    const targetProcess = Process.getFromPid(pid);
    if (!targetProcess) {
      // TODO: deliver ESRCH error back to source.. but have to do it async, even though
      // the API is sync! What to do here? Deliver it another signal? Or does it matter?
      //sourceProcess.postMessage({cmd: 'signal',
      console.log(`kill(${pid}, ${signal}) from ${sourceProcess.pid}, but ${pid} does not exist`);
      return;
    }

    targetProcess.postMessage({cmd: 'signal', fromPid: sourceProcess.pid, signal: signal});
  }
});

// Send a message to the sandboxed iframe, aka the userland
function postUserland(pid, msg) {
  const process = processes.get(pid);
  if (!process) throw new Error(`no such process: ${pid}`);

  process.postMessage(msg);
}

// Evaluate code within a given sandbox
function evalin(pid, code) {
  postUserland(pid, {cmd: 'eval', code: code});
}

module.exports = {
  Process,
  evalin,
  postUserland,
};
