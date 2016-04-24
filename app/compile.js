'use strict';

// Node.js script to compile browser bundle using browserify

const browserify = require('browserify');
const fs = require('fs');
const path = require('path');

const preludePath = path.join(__dirname, 'prelude2.js');

const builtins = require('browserify/lib/builtins');
builtins.fs = require.resolve('./fs.js');
builtins.process = require.resolve('./process.js');
builtins._process = builtins.process; // browserify has its own, recognizes implicit global without require

// force acorn@3 to get fixes for CSP https://github.com/substack/node-detective/issues/52
// https://github.com/ternjs/acorn/issues/90  https://github.com/substack/node-detective/pull/64
// https://github.com/ternjs/acorn/commit/aed55f3881beb1ea26d8622ada9973839b2b7175
builtins.acorn = require.resolve('acorn');

fs.readFile(preludePath, 'utf8', (err, prelude) => {
  if (err) throw err;
  const b = browserify('./main.js', {
    debug: true,
    builtins: builtins,
    preludePath: preludePath,
    prelude: prelude,
  });
  b.bundle().pipe(process.stdout);
});
