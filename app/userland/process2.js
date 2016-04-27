'use strict';

// Extend the process global with some more functionality
// This augments what is already provided by https://github.com/defunctzombie/node-process/blob/master/browser.js

// https://nodejs.org/api/process.html
process.exit = (code) => {
  process.stderr.write(`\n\nProcess exited with code ${code}\n`);
};
Object.assign(process.versions, {
  node: '4.2.4', // simulated node.js compatibility level version (optimistic)
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
require('./stdout');

// http://stackoverflow.com/questions/24042861/node-js-what-does-process-binding-mean
// "This function returns internal module, like require"
// Undocumented on https://nodejs.org/api/process.html
// process/browser.js throws an exception, but builtin-modules tries to filter on it
// Just return an empty dictionary
process.binding = (module) => {
  console.log(`process.binding(${module})`);
  return {};
};
