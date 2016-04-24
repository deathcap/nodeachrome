'use strict';

const browserify = require('browserify');

const b = browserify('./main.js', { debug: true });
b.bundle().pipe(process.stdout);
