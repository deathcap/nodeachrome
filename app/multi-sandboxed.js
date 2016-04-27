'use strict';

// Code below runs within an individual sandbox, talks back to main (in multi.js)

let mainSource = null;
let mainOrigin = null;

global.OUR_SANDBOX_ID = null; // our sandbox identifier, who we are. global _per sandbox_

window.addEventListener('message', (event) => {
  if (event.data.cmd === 'ping') {
    // save for sending messages back to main thread later
    mainSource = event.source;
    mainOrigin = event.origin;
    global.OUR_SANDBOX_ID = event.data.sbID;
    console.log('sandbox received ping:',event.data);

    event.source.postMessage({pong: true, sbID: event.data.sbID}, event.origin);
  }
});

function postMessageToMain(msg) {
  // To main thread
  mainSource.postMessage(msg, mainOrigin);
}

module.exports = {
  postMessageToMain,
};
