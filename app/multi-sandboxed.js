'use strict';

// Code below runs within an individual sandbox, talks back to main (in multi.js)

let mainSource = null;
let mainOrigin = null;

// our sandbox identifier, who we are. global _per sandbox_ - basically like a Unix pid
process.pid = null;

window.addEventListener('message', (event) => {
  if (event.data.cmd === '_start') {
    // Start a new sandbox (like _start in C or Unix, runs before main)

    // save for sending messages back to main thread later
    mainSource = event.source;
    mainOrigin = event.origin;
    process.pid = event.data.pid;
    process.argv = event.data.argv || [];
    process.env = event.data.env || {};

    console.log('sandbox received _start:',event.data);
    process.stdout.write(`started pid=${process.pid}, argv=${JSON.stringify(process.argv)}, env=${JSON.stringify(process.env)}`);

    event.source.postMessage({pong: true, pid: event.data.pid}, event.origin);
  }
});

function postMessageToMain(msg) {
  // To main thread
  mainSource.postMessage(msg, mainOrigin);
}

module.exports = {
  postMessageToMain,
};
