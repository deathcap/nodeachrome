'use strict';

// "System calls", userland -> kernel
// Code below runs within an individual sandbox, talks back to 'kernel' (= main thread), in multi.js

let kernelSource = null;
let kernelOrigin = null;

// our sandbox identifier, who we are. global _per sandbox_ - basically like a Unix pid
// TODO: replace with getter/setter defineProperty, since not actually supposed to set it, per the API
process.pid = null;

window.addEventListener('message', (event) => {
  if (event.data.cmd === '_start') {
    // Start a new sandbox (like _start in C or Unix, runs before kernel)

    // save for sending messages back to kernel thread later
    kernelSource = event.source;
    kernelOrigin = event.origin;
    process.pid = event.data.pid;
    process.argv = ['/bin/node'].concat(event.data.argv || ['a.out']); // [0]=always node, [1]=script name, [2]=args
    process.title = process.argv[1];
    process.env = event.data.env || {};

    console.log('sandbox received _start:',event.data);
    process.stdout.write(`\nStarted pid=${process.pid}, argv=${JSON.stringify(process.argv)}, env=${JSON.stringify(process.env)}\n`);

    event.source.postMessage({cmd: 'started'}, event.origin);

    if (process.argv[1] === 'init') {
      require('./bin/init');
    } else if (process.argv[1] === 'npm') {
      require('./bin/npm');
    } else if (process.argv[1] === 'browserify') {
      require('./bin/browserify');
    } else {
      // TODO: dynamic requires
    }
  }
});

function syscall(msg) {
  kernelSource.postMessage(msg, kernelOrigin);
}

module.exports = {
  syscall,
};
