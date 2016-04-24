'use strict';

const application = 'io.github.deathcap.nodeachrome';

function decodeResponse(response, cb) {
  if (typeof cb !== 'function') { console.error('??? decodeResponse non-string callback',cb); cb = () => {}; }
  if (!response) return cb(chrome.runtime.lastError);
  if (response.error) return cb(new Error(response.error.message));
  return cb(null, response.result);
}

// Send message using Google Chrome Native Messaging API to a native code host
function sendNative(method, params, cb) {
  console.log('sendNative',method,params);
  const msg = {method: method, params: params};
  chrome.runtime.sendNativeMessage(application, msg, (response) => decodeResponse(response, cb));
}

module.exports = sendNative;
