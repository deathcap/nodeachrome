'use strict';

// Node.js fs API implementations, synchronous and static methods

// https://nodejs.org/api/fs.html

module.exports = (fs) => {


// TODO: write this data to disk too, so it is consistent on the OS filesystem
const STATIC_FILE_DATA = {
  '/greeting': new Buffer('hello world'),

  // npm reads its own version from its package.json
  '/node_modules/npm/package.json': new Buffer(JSON.stringify({version: '3.6.0'})),

  // cat ./node_modules/browser-pack/_prelude.js
  // This should match ../tools/prelude2.js (adds require.resolve addition), if the web-based browserify
  // is to match the node-based browserify bundle output. TODO: refactor to avoid duplication
  '/node_modules/browser-pack/_prelude.js': new Buffer(`//based on https://github.com/substack/browser-pack/blob/01d39894f7168983f66200e727cdaadf881cd39d/prelude.js
// modules are defined as an array
// [ module function, map of requireuires ]
//
// map of requireuires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the requireuire for previous bundles

(function outer (modules, cache, entry) {
    // Save the require from previous bundle to this closure if any
    var previousRequire = typeof require == "function" && require;

    function newRequire(name, jumped){
        if(!cache[name]) {
            if(!modules[name]) {
                // if we cannot find the module within our internal map or
                // cache jump to the current global require ie. the last bundle
                // that was added to the page.
                var currentRequire = typeof require == "function" && require;
                if (!jumped && currentRequire) return currentRequire(name, true);

                // If there are other bundles on this page the require from the
                // previous one is saved to 'previousRequire'. Repeat this as
                // many times as there are bundles until the module is found or
                // we exhaust the require chain.
                if (previousRequire) return previousRequire(name, true);
                var err = new Error('Cannot find module \'' + name + '\'');
                err.code = 'MODULE_NOT_FOUND';
                throw err;
            }
            var m = cache[name] = {exports:{}};
            var R = (x) => {
                var id = modules[name][1][x];
                return newRequire(id ? id : x);
            };
            // https://github.com/deathcap/webnpm/issues/5 Implement require.resolve
            R.resolve = (module) => {
                console.log('require.resolve', module);
                return module;
            };
            modules[name][0].call(m.exports, R
            ,m,m.exports,outer,modules,cache,entry);
        }
        return cache[name].exports;
    }
    for(var i=0;i<entry.length;i++) newRequire(entry[i]);

    // Override the current require with this new one
    return newRequire;
})`),

};

const STATIC_DIR_DATA = {
  // path: [ files ]
};

fs.readFileSync = (file, options) => {
  console.log('readFileSync',file,options);

  const data = STATIC_FILE_DATA[file];
  if (data === undefined) {
    const e = new Error(`no such file or directory: ${file}`);
    e.code = 'ENOENT';
    e.errno = -2;
    throw e;
  }

  let encoding = null;
  if (typeof options === 'string') {
    encoding = options;
  } else if (typeof options === 'object') {
    encoding = options.encoding;
  }

  return data.toString(encoding);
};

fs.readdirSync = (path) => {
  if (path in STATIC_DIR_DATA) {
    return STATIC_DIR_DATA[path];
  }
  const e = new Error(`no such file or directory, readdirSync '${path}'`);
  e.errno = -2;
  e.code = 'ENOENT';
  throw e;
};

fs.statSync = (path) => {
  // if any are needed, add here (intentionally left blank)


  const e = new Error(`no such file or directory, statSync '${path}'`);
  e.errno = -2;
  e.code = 'ENOENT';
  throw e;
};

};
