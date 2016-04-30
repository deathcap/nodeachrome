'use strict';

// Node.js-compatibleish child_process API
//
// https://nodejs.org/api/child_process.html

const syscall = require('./syscall').syscall;

// https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options
function spawn(command, args=[], options={}) {
 
  const cwd = options.cwd !== undefined ? options.cwd : process.cwd(); // hmm, but docs say defaults to 'undefined
  const env = options.env !== undefined ? options.env : process.env; // inherit from parent

  syscall({cmd: 'spawn', command, args, env});

  // TODO: return a new ChildProcess
}

module.exports = {
  spawn,
};
