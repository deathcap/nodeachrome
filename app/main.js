'use strict';

require('shellasync/global'); // export some useful shell-like functions: cat(), ls(), ... using node.js fs async APIs
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

  evalsb: evalsb,
};

// Send a message to the sandboxed iframe - this can run eval()
function postSandbox(msg) {
  const iframe = document.getElementById('sandbox');
  const targetOrigin = '*';
  iframe.contentWindow.postMessage(msg, targetOrigin);
}

// Evaluate code in sandboxed frame
function evalsb(code) {
  postSandbox({cmd: 'eval', code: code});
}

window.addEventListener('load', (event) => {
  console.log('onload');
  // When the page loads, first contact the sandbox frame
  postSandbox({cmd: 'ping'});
});

const sendNative = require('./send-native');

window.addEventListener('message', (event) => {
  console.log('received sandbox iframe message:',event);
  console.log('event data:',event.data);
  console.log('event source:',event.source);

  // Main thread receives sendNative messages from sandbox -> sends them to native host
  if (event.data.cmd === 'sendNative') {
    console.log('received main thread sendNative event:',event);
    sendNative(event.data.msg);
  }
});

