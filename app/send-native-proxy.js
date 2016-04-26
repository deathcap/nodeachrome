'use strict';

// Runs in sandbox, sends messages to main thread (proxiedSendNative exported)
// Receives messages (recvNative) from main thread and dispatches callbacks

let callbacks = new Map();
let nextID = 1;

let mainSource = null;
let mainOrigin = null;

window.addEventListener('message', (event) => {
  if (event.data.cmd === 'ping') {
    event.source.postMessage({pong: true}, event.origin);

    // save for sending messages back to main thread later
    mainSource = event.source;
    mainOrigin = event.origin;
  } else if (event.data.cmd === 'recvNative') {
    console.log('recvNative in sandbox', event.data);
    handleIncoming(event.data.msg);
  }
});

function handleIncoming(msg) {
  const cb = callbacks.get(msg.id);
  if (!cb) {
    throw new Error(`received native host message with unexpected id: ${msg.id} in ${JSON.stringify(msg)}`);
  }

  cb(msg);
  callbacks.delete(msg.id);
}

function decodeResponse(response, cb) {
  console.log('decodeResponse',response);
  if (typeof cb !== 'function') { console.error('??? decodeResponse non-string callback',cb); cb = () => {}; }
  if (!response) return cb(chrome.runtime.lastError);
  if (response.error) return cb(new Error(response.error.message));
  if (response.outBuffer) return cb(null, response.result, response.outBuffer); // fs.read() special-case

  return cb(null, response.result);
}

function proxiedSendNative(method, params, cb) {
  console.log('proxiedSendNative',method,params);
  const id = nextID;
  nextID += 1;

  // To main thread
  mainSource.postMessage({cmd: 'sendNative', method, params, id}, mainOrigin);

  callbacks.set(id, (response) => decodeResponse(response, cb));
};

module.exports = proxiedSendNative;
