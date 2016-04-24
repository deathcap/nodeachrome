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

fs.access = (path, mode, cb) => {
  if (!cb) {
    cb = mode;
    sendNative('fs.access', [path], cb);
  } else {
    sendNative('fs.access', [path, mode], cb);
  }
};

fs.chmod = (path, mode, cb) => sendNative('fs.chmod', [path, mode], cb);
fs.chown = (path, uid, gid, cb) => sendNative('fs.chown', [path, uid, gid], cb);
fs.close = (fd, cb) => sendNative('fs.close', [fd], cb);

//TODO fs.createReadStream

fs.exists = (path, cb) => sendNative('fs.exists', [path], cb);
fs.fstat = (fd, cb) => sendNative('fs.fstat', [fd], cb);
fs.lstat = (path, cb) => sendNative('fs.lstat', [path], cb);

fs.open = (path, flags, mode, cb) => {
  if (!cb) {
    cb = mode;
    sendNative('fs.open', [path, flags], cb);
  } else {
    sendNative('fs.open', [path, flags, mode], cb);
  }
}

fs.readFile = (path, options, cb) => {
  if (!cb) {
    cb = options;
    sendNative('fs.readFile', [path], cb);
  } else {
    sendNative('fs.readFile', [path, options], cb);
  }
};

fs.readdir = (path, cb) => sendNative('fs.readdir', [path], cb);
fs.readlink = (path, cb) => sendNative('fs.readlink', [path], cb);
fs.realpath = (path, cache, cb) => {
  if (!cb) {
    cb = cache;
    sendNative('fs.realpath', [path], cb);
  } else {
    sendNative('fs.realpath', [path, cache], cb);
  }
};

fs.rename = (oldPath, newPath, cb) => sendNative('fs.rename', [oldPath, newPath], cb);
fs.rmdir = (path, cb) => sendNative('fs.rmdir', [path], cb);
fs.stat = (path, cb) => sendNative('fs.stat', [path], cb);
fs.symlink = (target, path, type, cb) => {
  if (!cb) {
    cb = type;
    sendNative('fs.symlink', [target, path], cb);
  } else {
    sendNative('fs.symlink', [target, path, type], cb);
  }
};
fs.unlink = (path, cb) => sendNative('fs.unlink', [path], cb);
fs.writeFile = (file, data, options, cb) => {
  if (!cb) {
    cb = options;
    sendNative('fs.writeFile', [file, data], cb);
  } else {
    sendNative('fs.writeFile', [file, data, options], cb);
  }
};
