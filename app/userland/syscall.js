'use strict';

// "System calls", userland -> kernel
// Code below runs within an individual sandbox, talks back to 'kernel' (= main thread), in multi.js

const kernel = require('./_start').kernel; // get kernel origin/source on startup

function syscall(msg) {
  kernel.source.postMessage(msg, kernel.origin);
}

module.exports = {
  syscall,
};
