'use strict';

require('shellasync/global'); // export some useful shell-like functions: cat(), ls(), ... using node.js fs async APIs
require('./ui')(); // wire up button event handlers

// Expose globally for debugging
global.g = {
  require: require,
  fs: require('fs'),
  process: require('process'),
  browserify: require('browserify'),
  npm: require('npm'),
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

  // relevant bits for cli
  const nopt = require('./node_modules/npm/node_modules/nopt');
  const npmconf = require('./node_modules/npm/lib/config/core.js');
  const configDefs = npmconf.defs;
  const shorthands = configDefs.shorthands;
  const types = configDefs.types;
  const errorHandler = require('./node_modules/npm/lib/utils/error-handler.js');

  global.npm_cli = function() {
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
  };
}
