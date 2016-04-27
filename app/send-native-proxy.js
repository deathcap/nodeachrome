'use strict';

// Runs in sandbox, sends messages to main thread (proxiedSendNative exported)
// Receives messages (recvNative) from main thread and dispatches callbacks

let callbacks = new Map();
let nextID = 1;

let mainSource = null;
let mainOrigin = null;

let ourSandboxID = null;

window.addEventListener('message', (event) => {
  if (event.data.cmd === 'ping') {
    event.source.postMessage({pong: true}, event.origin);

    // save for sending messages back to main thread later
    mainSource = event.source;
    mainOrigin = event.origin;
    ourSandboxID = event.data.sandbox_id;
    console.log('sandbox received ping:',event.data);
  } else if (event.data.cmd === 'recvNative') {
    //console.log('recvNative in sandbox', event.data);
    handleIncoming(event.data.msg);
  }
});

function handleIncoming(msg) {
  const cb = callbacks.get(msg.msgID);
  if (!cb) {
    throw new Error(`received native host message with unexpected id: ${msg.msgID} in ${JSON.stringify(msg)}`);
  }

  cb(msg);
  callbacks.delete(msg.msgID);
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
  //console.log('proxiedSendNative',method,params);
  const msgID = nextID;
  nextID += 1;

  // To main thread
  // TODO: send ourSandboxID
  mainSource.postMessage({cmd: 'sendNative', method, params, msgID}, mainOrigin);

  callbacks.set(msgID, (response) => decodeResponse(response, cb));
};

module.exports = proxiedSendNative;
