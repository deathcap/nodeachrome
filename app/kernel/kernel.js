'use strict';

// Main "kernel", manages sandboxes (~processes)

require('./ui')(); // wire up button event handlers
require('./native.js');

const spawn = require('./scheduler').spawn;
const evalin = require('./scheduler').evalin;
const kill = require('./scheduler').kill;

// Globally default environment variables, set here since processes inherit them
const ENV = {
  TERM: 'xterm-256color',
  SHELL: '/bin/sh',
  USER: 'user',
  LOGNAME: 'user',
  PATH: '~/.bin/:/usr/bin/:/bin:/usr/sbin:/sbin:/usr/local/bin',
  PWD: '/',
  HOME: '/home',
};

// Expose globally for debugging
Object.assign(global, {
  spawn: spawn,
  evalin: evalin,
  kill: kill,
  ENV: ENV,
});

console.log('creating initial sandbox');
spawn(['init']); // when page loads, create first sandbox
