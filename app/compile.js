'use strict';

// Node.js script to compile browser bundle using browserify

const browserify = require('browserify');
const fs = require('fs');
const path = require('path');

const preludePath = path.join(__dirname, 'prelude2.js');

const builtins = require('browserify/lib/builtins');
builtins.fs = require.resolve('./fs.js');

// force acorn@3 to get fixes for CSP https://github.com/substack/node-detective/issues/52
// https://github.com/ternjs/acorn/issues/90  https://github.com/substack/node-detective/pull/64
// https://github.com/ternjs/acorn/commit/aed55f3881beb1ea26d8622ada9973839b2b7175
builtins.acorn = require.resolve('acorn');

// npm-registry-client browserify support
builtins['npm-registry-client'] = require.resolve('npm-registry-client');

fs.readFile(preludePath, 'utf8', (err, prelude) => {
  if (err) throw err;
  const opts = {
    debug: true,
    builtins: builtins,
    preludePath: preludePath,
    prelude: prelude,
  };
  const b = browserify('./main.js', opts);
  b.bundle().pipe(fs.createWriteStream(path.join(__dirname, 'bundle-main.js')));

  const b2 = browserify('./sandboxed.js', opts);
  b2.bundle().pipe(fs.createWriteStream(path.join(__dirname, 'bundle-sandboxed.js')));
});
