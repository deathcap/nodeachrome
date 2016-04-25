# nodeachrome: bringing javascript back to the browser

An experimental prototype for running Node.js scripts in Google Chrome

## why?

JavaScript initially made its mark in the browser.
[Node.js](https://nodejs.org) popularized running JavaScript on
the desktop (and [npm](https://www.npmjs.com) for package management).
[browserify](http://browserify.org) enabled using much of the code
and tooling written for Node/NPM on any web browser.

But browserify creates an unusual situation when developing web-based
applications. There are two completely separate JavaScript engines and
runtimes and platforms: Node.js used for tooling and command-line testing,
and the browser used for everything else. Nodeachrome attempts to reconcile
this discrepancy by allowing a (hopefully) useful subset of Node scripts
to run directly within the Google Chrome web browser.

## how?

Nodeachrome is packaged as a Chrome extension (in `app/`), with a
[native messaging host](https://developer.chrome.com/extensions/nativeMessaging) component
(in `host/`) to provide native OS functionality where necessary. You can interact with
it through the Developer Tools console (TODO: native command-line interface via host).
Currently, Node.js is still required for bootstrapping, but in principle if this project
is successful it should be possible to self-host Nodeachrome without Node.js, at some point.
NPM and browserify are the primary targeted use cases.

## setup

1. Build the Chrome extension:

    cd app
    npm install
    npm start

2. Install the Chrome extension by navigating to chrome://extensions, checking "Developer mode",
then selecting "Load unpacked extension..." and choose the "app" folder you just built.

3. Configure the native host. Edit `host/io.github.deathcap.nodeachrome.json` and specify the full
path to nodeachrome.js in the `path` field (it is set for my system, but your path will differ),
and update the `allowed-origins` field to the chrome-extension:// URL matching the ID shown in
chrome://extensions/. Finally, edit `host/nodeachrome.js` and specify the full path to `node`
in the `#!` line.

4. Register the native host running `sudo host/register.sh`, or copying the .json file to
`/Library/Google/Chrome/NativeMessagingHosts` (on OS X, may differ other systems,
[see here](https://github.com/jdiamond/chrome-native-messaging)). 

5. Launch the Chrome extension app in chrome://extensions click "Launch". This opens up a debugging
window for sending commands to the native host. For the full JavaScript environment: Inspect views: main.html,
open the JavaScript console. Interact with the console by typing JavaScript, see below for APIs.

## fs sandbox

The `sandbox/` directory is exposed through the Chrome extension via the native host. You can use
your normal text editors and file management tools to manipulate this directory, and use it from
Nodeachrome with (a subset of, the mostly-compatible) [Node fs API](https://nodejs.org/api/fs.html).

[shellasync](https://www.npmjs.com/package/shellasync) is included on the global object providing
`ls()`, `cat()`, etc. shell-like functions, for interactive convenience in using `fs`.

## api

* Most [browserify builtins](https://github.com/substack/node-browserify/blob/master/lib/builtins.js), exposed on global `g`
* [fs](https://nodejs.org/api/fs.html)
 * async methods using native host to fs sandbox (see above)
 * sync methods return hardcoded results
* [http](https://nodejs.org/api/http.html), [https](https://nodejs.org/api/https.html) through browserify default [stream-http](http://npmjs.com/package/stream-http) and [https-browserify](http://npmjs.com/package/https-browserify), but allows any origin (unlike a website) due to permissions: `http://*/`, `https://*/` 
* [process](https://nodejs.org/api/process.html)
 * default browserify [process/browser](https://www.npmjs.com/package/process) + augmented ./more-process.js
 * process.stdout, stderr from [browser-stdout](https://www.npmjs.com/package/browser-stdout)
* require.resolve(x) returns x, modified browserify prelude in prelude2.js
* [browserify](http://browserify.org) API (TODO: fix `g.browserify('foo.js').bundle().pipe(g.process.stdout)`)
* [npm](https://www.npmjs.com) API
 * `npm_cli`, simulates npm(1) command-line, example: `g.npm_cli(['/bin/node', 'npm', 'view', 'voxel-engine'])`

## License

MIT

