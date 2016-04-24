'use strict';

require('shellasync/global'); // export some useful shell-like functions: cat(), ls(), ... using node.js fs async APIs
require('./ui')(); // wire up button event handlers

// Extend the process global with some more functionality
// https://nodejs.org/api/process.html
Object.assign(process.env, {
  TERM: 'xterm-256color',
  SHELL: '/bin/sh',
  USER: 'user',
  LOGNAME: 'user',
  PATH: '~/.bin/:/usr/bin/:/bin:/usr/sbin:/sbin:/usr/local/bin',
  PWD: '/',
  HOME: '/',
});
process.exit = (code) => {
  console.log(`process.exit(${code})`);
};
Object.assign(process.versions, {
  node: '4.2.4', // simulated node.js compatibility level version (optimistic)
  app: navigator.appVersion,
  webkit: navigator.appVersion.match(/WebKit\/([\d.]+)/)[1],
  chrome: navigator.appVersion.match(/Chrome\/([\d.]+)/)[1],
  // TODO: how can we get v8 version? if at all, from Chrome version? node process.versions has it
});
process.version = process.versions.node;
process.cwd = () => {
  return process.env.PWD;
};
// stdout/stderr
// TODO: try https://github.com/kumavis/browser-stdout
const Writable = require('stream').Writable;
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
  npm_cli: function(argv) {
    process.argv = argv || ['/bin/node', 'npm', 'version'];
    return require('npm/bin/npm-cli');
  },
  setup_npm: setup_npm,
};

function setup_npm() {
  // based on https://github.com/deathcap/webnpm/blob/master/webnpm.js
  const config = {
    // until https://github.com/npm/npm-registry-couchapp/issues/108#issuecomment-73352201 add support for CORS headers
    // from https://github.com/Rob--W/cors-anywhere/
    // fails with 'A wildcard '*' cannot be used in the 'Access-Control-Allow-Origin' header when the credentials flag is true.
    // Origin 'http://localhost:9966' is therefore not allowed access.' withCredentials false, then it works
    //registry: 'http://cors-anywhere.herokuapp.com/http://registry.npmjs.org',
    registry: 'http://cors.maxogden.com/http://registry.npmjs.org',
    // from https://github.com/zeke/npm-registry-cors-proxy, but it does not allow OPTIONS - '404 Not Found Cannot OPTIONS /voxel-engine'
    //registry: 'http://npm-registry-cors-proxy.herokuapp.com',

    // npm.config.get('argv').cooked requires nopt parsing, used by faq and help
    // TODO: call npm-cli https://github.com/deathcap/webnpm/issues/8
    argv: {cooked: []},
  };

  /*
  npm.load(config, (err) => {
    if (err) {
      console.log('npm load failed:',err);
      return;
    }

    console.log('WebNPM loaded. Try browserify() or npm.commands.*()');
  });
  */

  const asarray = require('asarray');
  const npm = require('npm');

  // relevant bits for cli
  const nopt = require('./node_modules/npm/node_modules/nopt');
  const npmconf = require('./node_modules/npm/lib/config/core.js');
  const configDefs = npmconf.defs;
  const shorthands = configDefs.shorthands;
  const types = configDefs.types;
  const errorHandler = require('./node_modules/npm/lib/utils/error-handler.js');

  function npm_cli() {
    // Call the NPM command-line interface with the given function arguments
    process.argv = asarray(arguments); // for .slice, on Array but not arguments
    //require('npm/cli.js'); // this only works once :( TODO
    // We have to do our own option parsing
    var conf = nopt(types, shorthands);
    npm.argv = conf.argv.remain;
    if (npm.deref(npm.argv[0])) npm.command = npm.argv.shift();
    else config.usage = true;

    npm.commands[npm.command](npm.argv, errorHandler);
    // TODO: still need to reset some state here..
    // "Callback called more than once." if rerun with another command
  }

  return npm_cli();
}
