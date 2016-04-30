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
open the JavaScript console. Use `evalsb()` to evaluate code in the eval sandbox and
interact with the console by typing JavaScript, see below for APIs.

## api

### process

The Nodeachrome app is split into "kernel" and "userland", similar to textbook operating system architecture.
The kernel manages userland "processes", holding additional privileges over userland (access to the
native host, Chrome platform API, arbitrary XHR), but most code is expected to execute in userland processes.

When the kernel boots up, it will `spawn()` its first process. This creates a new HTML5 iframe with a unique
origin, aka [sandbox](https://developer.chrome.com/extensions/sandboxingEval). JavaScript code within the
process runs within its own isolated context, independent from other processes and the kernel, even having
its own global variables. It can only communicate by posting messages to the kernel, or writing to the
HTML document within its iframe.

You can debug the kernel by invoking the JavaScript console on kernel.html, or on a userland process
by right-clicking an iframe and chosing "Inspect". Note that userland processes are much more interesting,
the kernel is very minimal, by design.

Node.js [process](https://nodejs.org/api/process.html) API is partially supported,
using the default browserify [process/browser](https://www.npmjs.com/package/process), plus augmented with
additional functionality in ./process2.js.

`process.pid` is the process ID in userland, uniquely identifying each sandbox. Starts at 1, increments sequentially.

`process.env` is an environment variable dictionary, accessible in the kernel, and inherited in
userland processes.

`process.stdout` and `process.stderr` log to `console.log` and `console.error`, respectively,
similar to [browser-stdout](https://www.npmjs.com/package/browser-stdout). They also write to the
iframe document body, as preformatted text.

### fs

The `sandbox/` directory is exposed through the Chrome extension via the native host. You can use
your normal text editors and file management tools to manipulate this directory, and use it from
Nodeachrome with (a subset of, the mostly-compatible) [Node fs API](https://nodejs.org/api/fs.html).
There is no "web filesystem", or localStorage, or a virtual cloud filesystem here, you get real
filesystem access, within the sandbox directory.

Asynchronous methods use the aforementioned `sandbox/` directory on disk, via the native host.
Synchronous methods are special-cased to return hardcoded results.

[shellasync](https://www.npmjs.com/package/shellasync) is included on the global object providing
`ls()`, `cat()`, etc. shell-like functions, for interactive convenience in using `fs`

### net

The Node.js [net](https://nodejs.org/api/net.html) socket API is not supported, but apps should
be able to interact with the network using the [http](https://nodejs.org/api/http.html) and
[https](https://nodejs.org/api/https.html) APIs,
through the browserify default replacements
[stream-http](http://npmjs.com/package/stream-http) and [https-browserify](http://npmjs.com/package/https-browserify),
implemented using [XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest)
and/or [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)

Unlike websites, Chrome extensions are not necessarily bound by the Same-Origin Policy on network
requests. Nodeachrome's `manifest.json` specifies permissions `http://*/`, `https://*/`, so it can
access third-party websites like the NPM registry server. Sandboxes do not have this privilege, so
the window.fetch API is proxied to the kernel fetch API to retain this privilege. This allows the NPM
registry client to function, example:

    npm_cli(['/bin/node', 'npm', 'view', 'ucfirst'])

### other

* Most [browserify builtins](https://github.com/substack/node-browserify/blob/master/lib/builtins.js) are exposed on the global object
* require.resolve(x) returns x, modified browserify prelude in prelude2.js


## tools

Bundled tools intended to run under this project: (note: may be broken)

* [browserify](http://browserify.org) API (example: `browserify('foo.js').bundle().pipe(process.stdout)`)
* [npm](https://www.npmjs.com) API
 * `npm_cli`, simulates npm(1) command-line, example: `npm_cli(['/bin/node', 'npm', 'view', 'voxel-engine'])` (TODO: fix CORS)

## License

MIT

