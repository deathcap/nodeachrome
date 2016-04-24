'use strict';

require('shellasync/global'); // export some useful shell-like functions: cat(), ls(), ... using node.js fs async APIs
// https://github.com/npm/npm/blob/master/bin/npm-cli.js
require('./ui')(); // wire up button event handlers
require('./more-process');

// Expose globally for debugging
global.g = {
  require: require,
  process: process,

  // Pull in most implemented from https://github.com/substack/node-browserify/blob/master/lib/builtins.js
  assert: require('assert'),
  buffer: require('buffer'),
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
  npm: require('npm'),
  npm_cli: require('./npm-cli'),
};
