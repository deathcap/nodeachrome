// based on https://github.com/npm/npm/blob/40c1b0f5cba5c4ecbcea8e9a7def9965682c2701/bin/npm-cli.js

//#!/usr/bin/env node
module.exports = (function (argv) { // wrapper in case we're in module_context mode  edit: set module.exports, add argv
  process.argv = argv;

  // windows: running "npm blah" in this folder will invoke WSH, not node.
  /*global WScript*/
  if (typeof WScript !== 'undefined') {
    WScript.echo(
      'npm does not work when run\n' +
        'with the Windows Scripting Host\n\n' +
        "'cd' to a different directory,\n" +
        "or type 'npm.cmd <args>',\n" +
        "or type 'node npm <args>'."
    )
    WScript.quit(1)
    return
  }

  process.title = 'npm'

  // Fix interoperability issue between:
  // request/request.js https://github.com/request/request
  // http (browserified) uses https://github.com/jhiesey/stream-http api: https://nodejs.org/api/http.html
  /* request.js contains:

    // XXX This is different on 0.10, because SSL is strict by default
    if (self.httpModule === https &&
        self.strictSSL && (!response.hasOwnProperty('socket') ||
        !response.socket.authorized)) {

  but browserified http response doesn't contain the "socket" property (no underlying socket access),
  so it cannot check response.socket.authorized. Set strictSSL false via npm config to avoid this check.
TODO: does the browser actually perform the SSL validation check anyways? I'd think so
   */
  process.env['npm_config_strict-ssl'] = 'false';

  var log = require('./node_modules/npm/node_modules/npmlog') // edit: ./node-_modules/npm/node_modules-relative paths
  //log.pause() // will be unpaused when config is loaded. edit: disable

  log.info('it worked if it ends with', 'ok')

  var path = require('path')
  var npm = require('./node_modules/npm/node_modules/../lib/npm.js')
  var npmconf = require('./node_modules/npm/node_modules/../lib/config/core.js')
  var errorHandler = require('./node_modules/npm/node_modules/../lib/utils/error-handler.js')

  var configDefs = npmconf.defs
  var shorthands = configDefs.shorthands
  var types = configDefs.types
  var nopt = require('./node_modules/npm/node_modules/nopt')

  // for reasons I'm not entirely clear with, the process.stderr browser-stdout stream https://github.com/kumavis/browser-stdout/
  // although derives from Writable, does not pass the instanceof check for Stream, at least in the browser:
  // > g.process.stdout instanceof g.require('stream').Stream
  // false
  // > g.process.stdout instanceof g.require('stream').Writable
  // true
  //
  // This fails nopt npm configuration validation in the default 'logstream' option, set to process.stderr
  // Overwrite it to allow Writable too
  const stream = require('stream');
  nopt.typeDefs.Stream.validate = (data, k, val) => {
    // based on https://github.com/npm/nopt/blob/8900f8e3f039d5131c600700994e51f7b312c5fe/lib/nopt.js#L169-L172
    // added WritableStream check
    if (!(val instanceof stream.Stream) && !(val instanceof stream.Writable)) return false;
    data[k] = val;
  };

  // if npm is called as "npmg" or "npm_g", then
  // run in global mode.
  if (path.basename(process.argv[1]).slice(-1) === 'g') {
    process.argv.splice(1, 1, 'npm', '-g')
  }

  log.verbose('cli', process.argv)

  var conf = nopt(types, shorthands)
  npm.argv = conf.argv.remain
  if (npm.deref(npm.argv[0])) npm.command = npm.argv.shift()
  else conf.usage = true

  if (conf.version) {
    console.log(npm.version)
    return
  }

  if (conf.versions) {
    npm.command = 'version'
    conf.usage = false
    npm.argv = []
  }

  log.info('using', 'npm@%s', npm.version)
  log.info('using', 'node@%s', process.version)

  process.on('uncaughtException', errorHandler)

  if (conf.usage && npm.command !== 'help') {
    npm.argv.unshift(npm.command)
    npm.command = 'help'
  }

  // now actually fire up npm and run the command.
  // this is how to use npm programmatically:
  conf._exit = true
  npm.load(conf, function (er) {
    console.log('npm.load: ', er);
    if (er) return errorHandler(er)
    npm.commands[npm.command](npm.argv, errorHandler)
  })
})//() // edit: do not self-execute
