'use strict';

// "Userland" process, runs in sandbox

require('shellasync/global'); // export some useful shell-like functions: cat(), ls(), ... using node.js fs async APIs
require('./process2');
require('./fetch');

// Expose globally for debugging
Object.assign(global, {
  require: require,
  process: process,

  // Pull in most implemented from https://github.com/substack/node-browserify/blob/master/lib/builtins.js
  assert: require('assert'),
  Buffer: require('buffer'),
  console: require('console'),
  constants: require('constants'),
  crypto: require('crypto'),
  domain: require('domain'),
  events: require('events'),
  fs: require('fs'), // our own ./fs.js
  http: require('http'),
  https: require('https'),
  os: require('os'),
  path: require('path'),
  querystring: require('querystring'),
  stream: require('stream'),
  string_decoder: require('string_decoder'),
  sys: require('sys'),
  timers: require('timers'),
  tty: require('tty'),
  url: require('url'),
  util: require('url'),
  vm: require('vm'),
  zlib: require('zlib'),

  // Useful apps
  browserify: require('browserify'),
  browserify_cli: require('./browserify-cli'),
  npm: require('npm'),
  npm_cli: require('./npm-cli'),
});

window.addEventListener('message', (event) => {
  if (event.data.cmd === 'eval') {
    event.source.postMessage({result: eval(event.data.code)}, event.origin);
  }
});
