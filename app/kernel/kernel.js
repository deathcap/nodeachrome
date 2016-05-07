'use strict';

// Main "kernel", manages sandboxes (~processes)

require('./native.js');
require('./kfetch.js');

const Process = require('./scheduler').Process;
const evalin = require('./scheduler').evalin;

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
  Process: Process,

  evalin: evalin,
  ENV: ENV,
});

require('./boot.js').boot();
