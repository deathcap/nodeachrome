'use strict';

// https://nodejs.org/api/process.html
//
// TODO: refactor with browserify's builtin process?
// https://github.com/substack/node-browserify/blob/master/lib/builtins.js#L38
// https://github.com/defunctzombie/node-process/blob/master/browser.js
const process = {};

// based on https://github.com/defunctzombie/node-process/blob/master/browser.js TODO: refactor
// removed some functions, implemented elsehow
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

/////////////////////////////////////////////////////////////////////////////
// custom process enhancements

const Writable = require('stream').Writable;

process.arch = 'wasm';
process.env = {
  TERM: 'xterm-256color',
  SHELL: '/bin/sh',
  USER: 'user',
  LOGNAME: 'user',
  PATH: '~/.bin/:/usr/bin/:/bin:/usr/sbin:/sbin:/usr/local/bin',
  PWD: '/',
  HOME: '/',
};
process.exit = (code) => {
  console.log(`process.exit(${code})`);
}
process.platform = 'chrome';
process.versions = {
  node: '4.2.4', // simulated node.js compatibility level version (optimistic)
  app: navigator.appVersion,
  webkit: navigator.appVersion.match(/WebKit\/([\d.]+)/)[1],
  chrome: navigator.appVersion.match(/Chrome\/([\d.]+)/)[1],
  // TODO: how can we get v8 version? if at all, from Chrome version? node process.versions has it
};
process.version = process.versions.node;
process.argv = ['npm'];
process.cwd = () => {
  return process.env.PWD;
};

process.stdout = Writable();
process.stdout._write = (chunk, enc, next) => {
  console.log('OUT',chunk.toString()); // TODO: terminal ansi emulation
  next();
};
process.stderr = Writable();
process.stderr._write = (chunk, enc, next) => {
  console.error('ERR',chunk.toString());
  next();
};
// TODO: stdin


module.exports = process;
