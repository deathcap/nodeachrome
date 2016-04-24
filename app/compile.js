'use strict';

const browserify = require('browserify');

const builtins = require('browserify/lib/builtins');
builtins.fs = require.resolve('./fs.js');
builtins.process = require.resolve('./process.js');

const b = browserify('./main.js', {
  debug: true,
  builtins: builtins,
});
b.bundle().pipe(process.stdout);
