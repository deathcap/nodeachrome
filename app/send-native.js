'use strict';

const application = 'io.github.deathcap.nodeachrome';

let callbacks = new Map();
let nextID = 1;
let port = null;

function decodeResponse(response, cb) {
  console.log('decodeResponse',response);
  if (typeof cb !== 'function') { console.error('??? decodeResponse non-string callback',cb); cb = () => {}; }
  if (!response) return cb(chrome.runtime.lastError);
  if (response.error) return cb(new Error(response.error.message));
  return cb(null, response.result);
}

function recvIncoming(msg) {
  const cb = callbacks.get(msg.id);
  if (!cb) {
    throw new Error(`received native host message with unexpected id: ${msg.id} in ${JSON.stringify(msg)}`);
  }

  cb(msg);

  callbacks.delete(msg.id);
}

function disconnected(e) {
  console.log('unexpected native host disconnect:',e);
  throw new Error('unexpected native host disconnect:'+e);
  // TODO: reconnect? if it crashes
}

function connectPort() {
  port = chrome.runtime.connectNative(application);
  port.onMessage.addListener(recvIncoming);
  port.onDisconnect.addListener(disconnected);

  return port;
}

// Send message using Google Chrome Native Messaging API to a native code host
function sendNative(method, params, cb) {
  console.log('sendNative',method,params);
  const id = nextID;
  nextID += 1;
  const msg = {method: method, params: params, id: id};

  if (!port) {
    port = connectPort();
  }

  callbacks.set(id, (response) => decodeResponse(response, cb));

  port.postMessage(msg);

  // the one-off sendNativeMessage call is convenient in that it accepts a response callback,
  // but it launches the host app every time, so it doesn't preserve open filehandles (for e.g. fs.open/fs.write)
  //chrome.runtime.sendNativeMessage(application, msg, (response) => decodeResponse(response, cb));
}

module.exports = sendNative;
