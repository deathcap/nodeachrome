'use strict';

require('shellasync/global'); // export some useful shell-like functions: cat(), ls(), ... using node.js fs async APIs
require('./ui')(); // wire up button event handlers

const fs = require('fs');
const process = require('process');
//const npm = require('npm'); // crashes at:   ReadStream.prototype = Object.create(fs$ReadStream.prototype), no fs.ReadStream defined
const browserify = require('browserify');
