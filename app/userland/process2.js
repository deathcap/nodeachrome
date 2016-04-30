'use strict';

// Extend the process global with some more functionality
// This augments what is already provided by https://github.com/defunctzombie/node-process/blob/master/browser.js

const syscall = require('./syscall').syscall;

// https://nodejs.org/api/process.html
process.exit = (code=0) => {
  process.exitCode = code;
  process.stderr.write(`\n\nProcess exited with code ${code}\n`);

  syscall({cmd: 'exit', code: code});
};


Object.assign(process.versions, {
  node: '6.0.0', // simulated node.js compatibility level version (optimistic)
  app: navigator.appVersion,
  webkit: navigator.appVersion.match(/WebKit\/([\d.]+)/)[1],
  chrome: navigator.appVersion.match(/Chrome\/([\d.]+)/)[1],
  // TODO: how can we get v8 version? if at all, from Chrome version? node process.versions has it
});
process.version = process.versions.node;
process.cwd = () => {
  return process.env.PWD;
};
process.execPath = '/bin/node';

// http://stackoverflow.com/questions/24042861/node-js-what-does-process-binding-mean
// "This function returns internal module, like require"
// Undocumented on https://nodejs.org/api/process.html
// process/browser.js throws an exception, but builtin-modules tries to filter on it
// Just return an empty dictionary
process.binding = (module) => {
  console.log(`process.binding(${module})`);
  return {};
};

// Changing process.title changes document title
// TODO: visibly show in chrome around iframe
Object.defineProperty(process, 'title', {
  //get: () => document.title,
  get: () => 'browser', // some code relies on it
  set: (title) => document.getElementById('title').innerText = document.title = title,
});

require('./stdout');
require('./signal');
