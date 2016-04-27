'use strict';

// "System calls", userland -> kernel
// Code below runs within an individual sandbox, talks back to 'kernel' (= main thread), in multi.js

let kernelSource = null;
let kernelOrigin = null;

// our sandbox identifier, who we are. global _per sandbox_ - basically like a Unix pid
process.pid = null;

window.addEventListener('message', (event) => {
  if (event.data.cmd === '_start') {
    // Start a new sandbox (like _start in C or Unix, runs before kernel)

    // save for sending messages back to kernel thread later
    kernelSource = event.source;
    kernelOrigin = event.origin;
    process.pid = event.data.pid;
    process.argv = event.data.argv || [];
    process.env = event.data.env || {};

    console.log('sandbox received _start:',event.data);
    process.stdout.write(`started pid=${process.pid}, argv=${JSON.stringify(process.argv)}, env=${JSON.stringify(process.env)}`);

    event.source.postMessage({pong: true, pid: event.data.pid}, event.origin);
  }
});

function postMessageToKernel(msg) {
  kernelSource.postMessage(msg, kernelOrigin);
}

module.exports = {
  postMessageToKernel,
};
