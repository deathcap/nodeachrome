'use strict';

const sendNative = require('./send-native');

// https://nodejs.org/api/fs.html


const fs = {};

fs.access = (path, mode, cb) => {
  if (!cb) {
    cb = mode;
    sendNative('fs.access', [path], cb);
  } else {
    sendNative('fs.access', [path, mode], cb);
  }
};

fs.chmod = (path, mode, cb) => sendNative('fs.chmod', [path, mode], cb);
fs.chown = (path, uid, gid, cb) => sendNative('fs.chown', [path, uid, gid], cb);
fs.close = (fd, cb) => sendNative('fs.close', [fd], cb);

//TODO fs.createReadStream

fs.exists = (path, cb) => sendNative('fs.exists', [path], cb);
fs.fstat = (fd, cb) => sendNative('fs.fstat', [fd], cb);
fs.lstat = (path, cb) => sendNative('fs.lstat', [path], cb);

fs.open = (path, flags, mode, cb) => {
  if (!cb) {
    cb = mode;
    sendNative('fs.open', [path, flags], cb);
  } else {
    sendNative('fs.open', [path, flags, mode], cb);
  }
}

fs.readFile = (path, options, cb) => {
  if (!cb) {
    cb = options;
    sendNative('fs.readFile', [path], cb);
  } else {
    sendNative('fs.readFile', [path, options], cb);
  }
};

const STATIC_FILE_DATA = {
  '/greeting': new Buffer('hello world'),

  // cat ./node_modules/browser-pack/_prelude.js
  // based on https://github.com/substack/browser-pack/blob/01d39894f7168983f66200e727cdaadf881cd39d/prelude.js
  // TODO: also prelude2.js
  '/node_modules/browser-pack/_prelude.js': new Buffer(`(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})`),
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

fs.readdir = (path, cb) => sendNative('fs.readdir', [path], cb);
fs.readlink = (path, cb) => sendNative('fs.readlink', [path], cb);
fs.realpath = (path, cache, cb) => {
  if (!cb) {
    cb = cache;
    sendNative('fs.realpath', [path], cb);
  } else {
    sendNative('fs.realpath', [path, cache], cb);
  }
};

fs.rename = (oldPath, newPath, cb) => sendNative('fs.rename', [oldPath, newPath], cb);
fs.rmdir = (path, cb) => sendNative('fs.rmdir', [path], cb);
fs.stat = (path, cb) => sendNative('fs.stat', [path], cb);
fs.symlink = (target, path, type, cb) => {
  if (!cb) {
    cb = type;
    sendNative('fs.symlink', [target, path], cb);
  } else {
    sendNative('fs.symlink', [target, path, type], cb);
  }
};
fs.unlink = (path, cb) => sendNative('fs.unlink', [path], cb);
fs.writeFile = (file, data, options, cb) => {
  if (!cb) {
    cb = options;
    sendNative('fs.writeFile', [file, data], cb);
  } else {
    sendNative('fs.writeFile', [file, data, options], cb);
  }
};

module.exports = fs;