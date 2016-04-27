'use strict';

require('./ui')(); // wire up button event handlers
require('./send-native.js');

const newsb = require('./multi').newsb;
const evalin = require('./multi').evalin;

// Expose globally for debugging
Object.assign(global, {
  newsb: newsb,
  evalin: evalin,
});

console.log('creating initial sandbox');
newsb(); // when page loads, create first sandbox
