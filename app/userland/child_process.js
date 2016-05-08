'use strict';

// Node.js-compatibleish child_process API
//
// https://nodejs.org/api/child_process.html

const EventEmitter = require('events').EventEmitter;
const syscall = require('./syscall').syscall;

let nextPid = null;

class ChildProcess extends EventEmitter {
  constructor(pid) {
    super();

    this.pid = pid;
  }

  kill(signal='SIGTERM') {
    process.kill(this.pid, signal);
  }
}

window.addEventListener('message', (event) => {
  if (event.data.cmd === 'nextPid') {
    // Received when a kernel spawns a new process, with the next expected process ID
    nextPid = event.data.nextPid;
  }
});

// https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options
function spawn(command, args=[], options={}) {
  if (Array.isArray(args)) throw new TypeError(`Incorrect value for args option, not array: ${args}`);
 
  const cwd = options.cwd !== undefined ? options.cwd : process.cwd(); // hmm, but docs say defaults to 'undefined
  const env = options.env !== undefined ? options.env : process.env; // inherit from parent

  // we have to return synchronously, so hope the child's pid will be nextPid
  // (passed and checked in kernel spawn handler to detect races)
  const childPid = nextPid;

  if (options.stdio) {
    if (options.stdio[0] === process.stdin) options.stdio[0] = 0;
    if (options.stdio[1] === process.stdout) options.stdio[1] = 1;
    if (options.stdio[2] === process.stderr) options.stdio[2] = 2;
    }
  }

  syscall({cmd: 'spawn', command, args, env, opts: options, expectedPid: childPid});

  return new ChildProcess(childPid);
}

function exec(command_string, options, cb) {
  const command_args = command_string.split(' '); // "The command to run, with space-separated arguments"
  const command = command_args[0];
  const args = command_args.slice(1);

  return spawn(command, args, options);
}

function fork(modulePath, args, options) {
  // TODO: require(modulePath) or what?
}

module.exports = {
  spawn,
  exec,
};
