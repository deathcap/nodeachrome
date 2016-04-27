'use strict';

// Main "kernel", manages sandboxes (~processes)

require('./ui')(); // wire up button event handlers
require('./native.js');

const spawn = require('./scheduler').spawn;
const evalin = require('./scheduler').evalin;
const kill = require('./scheduler').kill;

// Expose globally for debugging
Object.assign(global, {
  spawn: spawn,
  evalin: evalin,
  kill: kill,
  process: process, // TODO: don't expose 'process' in kernel, its not really useful, except for env
});

// Set environment variables here because processes may inherit them
Object.assign(process.env, {
  TERM: 'xterm-256color',
  SHELL: '/bin/sh',
  USER: 'user',
  LOGNAME: 'user',
  PATH: '~/.bin/:/usr/bin/:/bin:/usr/sbin:/sbin:/usr/local/bin',
  PWD: '/',
  HOME: '/home',
});

console.log('creating initial sandbox');
spawn(); // when page loads, create first sandbox
