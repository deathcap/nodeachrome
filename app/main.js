'use strict';

require('shellasync/global'); // export some useful shell-like functions: cat(), ls(), ... using node.js fs async APIs
require('./ui')(); // wire up button event handlers

// Expose globally for debugging
global.fs = require('fs');
global.process = require('process');
//global.npm = require('npm'); // crashes at:   ReadStream.prototype = Object.create(fs$ReadStream.prototype), no fs.ReadStream defined
global.browserify = require('browserify');
