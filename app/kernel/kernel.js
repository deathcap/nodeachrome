'use strict';

// Main "kernel", manages sandboxes (~processes)

require('./ui')(); // wire up button event handlers
require('./native.js');

const spawn = require('./scheduler').spawn;
const evalin = require('./scheduler').evalin;

// Expose globally for debugging
Object.assign(global, {
  spawn: spawn,
  evalin: evalin,
  process: process,
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
