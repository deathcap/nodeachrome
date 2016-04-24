'use strict';

const application = 'io.github.deathcap.nodeachrome';
let port = null;

document.getElementById('connect').addEventListener('click', () => {
  log('chrome.runtime.connectNative');

  port = chrome.runtime.connectNative(application);
  port.onMessage.addListener(log);
  port.onDisconnect.addListener((e) => {
    log('unexpected disconnect');
    port = null;
  });
});

document.getElementById('disconnect').addEventListener('click', () => {
  log('port.disconnect');
  port.disconnect();
  port = null;
});

document.getElementById('send').addEventListener('click', () => {
  const json = document.getElementById('msg').value;
  let msg;

  try {
    msg = JSON.parse(json);
  } catch (err) {
    return log('invalid JSON: ' + json);
  }

  if (port) {
    log('port.postMessage');
    port.postMessage(msg);
  } else {
    log('chrome.runtime.sendNativeMessage');
    chrome.runtime.sendNativeMessage(application, msg, log);
  }
});

document.getElementById('clear').addEventListener('click', () => {
  document.getElementById('log').innerHTML = '';
});

function log(msg) {
  console.log(msg);

  const e = document.createElement('pre');
  e.appendChild(document.createTextNode(typeof msg === 'object' ? JSON.stringify(msg) : msg));
  document.getElementById('log').appendChild(e);
}

function decodeResponse(response, cb) {
  if (!response) return cb(chrome.runtime.lastError);
  if (response.error) return cb(new Error(response.error.message));
  return cb(null, response.result);
}

function sendNative(method, params, cb) {
  const msg = {method: method, params: params};
  chrome.runtime.sendNativeMessage(application, msg, (response) => decodeResponse(response, cb));
}

let fs = {};
fs.readFile = (path, options, cb) => {
  if (!cb) cb = options;
  sendNative('fs.readFile', [path, options], cb); // TODO: 1-argument variation, would like to use arguments, or rest parameters but...
};
