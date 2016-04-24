'use strict';

// https://nodejs.org/api/process.html
//
// TODO: refactor with browserify's builtin process?
// https://github.com/substack/node-browserify/blob/master/lib/builtins.js#L38
// https://github.com/defunctzombie/node-process/blob/master/browser.js
const process = {};

const Writable = require('stream').Writable;

process.arch = 'wasm';
process.env = {
  TERM: 'xterm-256color',
  SHELL: '/bin/sh',
  USER: 'user',
  LOGNAME: 'user',
  PATH: '~/.bin/:/usr/bin/:/bin:/usr/sbin:/sbin:/usr/local/bin',
  PWD: '/Users/user',
  HOME: '/Users/user',
};
process.exit = (code) => {
  console.log(`process.exit(${code})`);
}
process.platform = 'chrome';
process.versions = {
  node: '4.2.4', // simulated node.js compatibility level version (optimistic)
  app: navigator.appVersion,
  webkit: navigator.appVersion.match(/WebKit\/([\d.]+)/)[1],
  chrome: navigator.appVersion.match(/Chrome\/([\d.]+)/)[1],
  // TODO: how can we get v8 version? if at all, from Chrome version? node process.versions has it
};
process.version = process.versions.node;
process.title = 'browser';

process.stdout = Writable();
process.stdout._write = (chunk, enc, next) => {
  console.log('OUT',chunk.toString()); // TODO: terminal ansi emulation
  next();
};
process.stderr = Writable();
process.stderr._write = (chunk, enc, next) => {
  console.error('ERR',chunk.toString());
  next();
};
// TODO: stdin

module.exports = process;
