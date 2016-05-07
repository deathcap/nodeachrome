'use strict';

// Kernel "scheduler" (analogous to OS), manages processes
// Maintains multiple independent execution contexts (processes) for JavaScript, using sandboxed iframes

let nextPid = 1;
let processes = new Map();
let sources = new Map();

// disable to see process output after they terminate for debugging
const TERMINATE_DEAD_PROCESSES = true;

const {createDraggableIframe} = require('./windowing');

class Process {
  // Create a new "userland" sandboxed execution context (= process)
  constructor() {
    this.state = 'new'; // see https://en.wikipedia.org/wiki/Process_state
    this.pid = nextPid;
    nextPid += 1;

    Process.broadcast({cmd: 'nextPid', nextPid});

    let {iframe, container, titleText, closeButton} = createDraggableIframe(this.pid);

    this.iframe = iframe;
    this.container = container;
    this.titleText = titleText;
    this.closeButton = closeButton;

    this.closeButton.addEventListener('click', (event) => {
      this.terminate(-1); // TODO: instead, send SIGTERM, let gracefully exit?
    });

    processes.set(this.pid, this);

    const containers = document.getElementById('userland-processes');
    containers.appendChild(container);

    console.log(`new Process pid=${this.pid}`);
    // process is created in frozen state, can be started with exec()
  }

  // Execute code with arguments and environment, like Unix fork/exec or posix_spawn/system
  exec(argv, env, redirects) {
    console.log(`Process exec ${this.pid}, argv ${JSON.stringify(argv)}, env ${JSON.stringify(env)}`);

    if (!env) env = global.ENV; // inherit from kernel TODO: per-process inheritance, forking

    // save own independent copy
    this.argv = JSON.parse(JSON.stringify(argv));
    this.env = JSON.parse(JSON.stringify(env));

    if (redirects && redirects.unixID) {
      // this process was launched from the Unix ./host/cli.js tool
      this.unixID = redirects.unixID;
    }

    this.state = 'waiting'; // awaiting execution
    this.iframe.setAttribute('src', '/userland/userland.html');
    this.iframe.addEventListener('load', (event) => {
      console.log('sandbox frame load',this.pid);

      sources.set(this.iframe.contentWindow, this);

      this.iframe.contentWindow.postMessage({cmd: '_start', pid: this.pid, argv: this.argv, env: this.env, redirects}, '*');
      this.state = 'ready'; // ready until process confirms it started by posting reply back to _start: 'started'
    });
    // TODO: add path, to require and/or readFile to execute and run
  }

  // IPC
  postMessage(msg) {
    if (!this.iframe.contentWindow) throw new Error(`unable to send to process, no iframe content: ${this.pid}`);

    this.iframe.contentWindow.postMessage(msg, '*');
  }

  static broadcast(msg) {
    for (let thisProcess of processes.values()) {
      thisProcess.postMessage(msg);
    }
  }

  terminate(code) {
    this.container.parentNode.removeChild(this.container);
    processes.delete(this.pid);
    console.log(`Terminated ${this.pid}`);
    this.state = 'terminated';
    this.exitCode = code;
    // TODO: zombies? when exit, may want to keep process around for examination, until the zombie is 'reaped'
  }

  set title(title) {
    this.titleText.textContent = title;
  }

  get title() {
    return this.titleText.textContent;
  }

  markDead(code) {
    this.state = 'dead';
    this.exitCode = code;

    this.title += ` (exited with code ${code})`;

    if (this.unixID) {
      // if process was created by Unix cli, let it know we exited
      const sendNative = require('./native').sendNative;
      sendNative('unix.exit', [this.unixID, this.pid, code],
        -1, this.pid); // msgID -1 is no callback, since this native call was unsolicited (sent from kernel not userland)
    }

    if (TERMINATE_DEAD_PROCESSES) {
      this.terminate(code);
    }
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
    const sourceProcess = Process.getFromSource(event.source);
    if (!sourceProcess) throw new Error(`started process not found: ${event.data}`);

    sourceProcess.state = 'running';
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
  } else if (event.data.cmd === 'exit') {
    const sourceProcess = Process.getFromSource(event.source);

    const code = event.data.code;

    // Give some time to inspect the process before it cleans up
    // TODO: zombie reaping model instead, mark dead but allow getting exit code, visual, but no IPC, etc.
    // and have /bin/init, the parent of all processes, 'reap' the zombies after they are done or whatever
    const terminateDelaySeconds = 5;
    console.log(`Process ${sourceProcess.pid} exited (${code}), terminating in ${terminateDelaySeconds}s`);

    sourceProcess.markDead(code);

    // TODO: when should this exit? leaving up for now to see terminated process output
    //sourceProcess.terminate(code);
  } else if (event.data.cmd === 'spawn') {
    const command = event.data.command;
    const args = event.data.args;

    const argv = [command].concat(event.data.args);
    const env = event.data.env;

    const newProcess = new Process();
    if (event.data.nextPid && newProcess.pid !== event.data.nextPid) {
      throw new Error(`spawn() expected pid ${event.data.nextPid} but got ${newProcess.pid}, race condition detected?`);
    }

    newProcess.exec(argv, env);
  } else if (event.data.cmd === 'setproctitle') {
    const sourceProcess = Process.getFromSource(event.source);

    sourceProcess.title = event.data.title;
  } else if (event.data.cmd === 'reboot') {
    const sourceProcess = Process.getFromSource(event.source);
    console.log(`Reboot initiated by process ${sourceProcess.pid}`);
    // Any process can reboot TODO: require special privileges? if only had privileges

    // Forcefully kill all processes
    // TODO: first try to gracefully terminate with SIGTERM, give some time, then force
    for (let proc of processes.values()) {
      proc.terminate(); // TODO: code to signify terminated by reboot?
    }

    // Reset to clean state
    processes.clear();
    sources.clear();
    nextPid = 1;

    require('./boot.js').boot();
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
