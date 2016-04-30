'use strict';

// Node.js-compatibleish child_process API
//
// https://nodejs.org/api/child_process.html

const EventEmitter = require('events').EventEmitter;
const syscall = require('./syscall').syscall;

class ChildProcess extends EventEmitter {
  constructor() {
    // TODO
    this.pid = null;
  }

  kill(signal='SIGTERM') {
    process.kill(this.pid, signal);
  }
}

// https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options
function spawn(command, args=[], options={}) {
 
  const cwd = options.cwd !== undefined ? options.cwd : process.cwd(); // hmm, but docs say defaults to 'undefined
  const env = options.env !== undefined ? options.env : process.env; // inherit from parent

  syscall({cmd: 'spawn', command, args, env});
  // TODO: how can we get a pid immediately? given that syscalls are async?!

  return new ChildProcess();
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
