'use strict';

const application = 'io.github.deathcap.nodeachrome';

let port = null;

function postSandbox(msg) {
  const iframe = document.getElementById('sandbox');
  const targetOrigin = '*';
  iframe.contentWindow.postMessage(msg, targetOrigin);
}

function disconnected(e) {
  console.log('unexpected native host disconnect:',e);
  throw new Error('unexpected native host disconnect:'+e);
  // TODO: reconnect? if it crashes
}

function recvIncoming(msg) {
  console.log('received incoming native msg:',msg);
  postSandbox({cmd: 'recvNative', msg: msg});
}

function connectPort() {
  port = chrome.runtime.connectNative(application);
  port.onMessage.addListener(recvIncoming);
  port.onDisconnect.addListener(disconnected);

  return port;
}

// Send message using Google Chrome Native Messaging API to a native code host
function sendNative(msg) {
  console.log('sendNative',msg);

  if (!port) {
    port = connectPort();
  }

  port.postMessage(msg);

  // the one-off sendNativeMessage call is convenient in that it accepts a response callback,
  // but it launches the host app every time, so it doesn't preserve open filehandles (for e.g. fs.open/fs.write)
  //chrome.runtime.sendNativeMessage(application, msg, (response) => decodeResponse(response, cb));
}

module.exports = sendNative;
