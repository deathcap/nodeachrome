'use strict';

// Node.js fs API implementations, synchronous and static methods

// https://nodejs.org/api/fs.html

const fs = {};

const STATIC_FILE_DATA = {
  '/greeting': new Buffer('hello world'),

  // npm reads its own version from its package.json
  '/node_modules/npm/package.json': new Buffer(JSON.stringify({version: '3.6.0'})),

  // cat ./node_modules/browser-pack/_prelude.js
  // based on https://github.com/substack/browser-pack/blob/01d39894f7168983f66200e727cdaadf881cd39d/prelude.js
  // TODO: also prelude2.js, will need to add require.resolve addition if self-hosting
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

module.exports = fs;
