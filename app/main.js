'use strict';

require('./ui')(); // wire up button event handlers
require('./send-native.js');

const newsb = require('./multi').newsb;
const evalin = require('./multi').evalin;

// Expose globally for debugging
Object.assign(global, {
  newsb: newsb,
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
newsb(); // when page loads, create first sandbox
