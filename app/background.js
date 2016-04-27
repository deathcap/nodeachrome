'use strict';

chrome.app.runtime.onLaunched.addListener(() => {
  chrome.app.window.create('kernel.html', {
    bounds: { width: 640, height: 480 }
  });
});
