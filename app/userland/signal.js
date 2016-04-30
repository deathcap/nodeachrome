'use strict';

const inherits = require('util').inherits;
const EventEmitter = require('events').EventEmitter;

const syscall = require('./syscall').syscall;

// process/browser.js noop()s all EventEmitter API (.emit, .on, ...), but we want it
//inherits(process, EventEmitter); // sets constructor, but 'process' is already constructed :(
const processEventEmitter = new EventEmitter();
process.on = processEventEmitter.on;
process.addListener = processEventEmitter.addListener;
process.once = processEventEmitter.once;
//process.off = processEventEmitter.off; // what is this?
process.removeListener = processEventEmitter.removeListener;
process.removeAllListeners = processEventEmitter.removeAllListeners;
process.emit = processEventEmitter.emit;

process.kill = (pid, signal='SIGTERM') => {
  syscall({cmd: 'kill', pid, signal});
};

window.addEventListener('message', (event) => {
  if (event.data.cmd === 'signal') {
    const fromPid = event.data.fromPid;
    const signal = event.data.signal;

    console.log(`Received signal ${signal} from ${fromPid}`);

    //process.emit(signal);
    process.emit(signal, fromPid); // extra non-standard argument note 2: also, another extension: signal can be any cloneable object (not just 'SIGxxxx' string)
  }
});

// Default signal handlers, see https://nodejs.org/api/process.html#process_signal_events
process.on('SIGUSR1', () => {
  debugger;
});

// TODO: remove/prevent default handlers, various per-signal behaviors, uncatchable

process.on('SIGKILL', (fromPid) => {
  // TODO: set WIFSIGNALED bit, sys/wait.h, lower bits are exit code, 'signaled' is higher:
  // (extra flag to process.exit?)
  /*
#define _WSTATUS(x)     (_W_INT(x) & 0177)
#define _WSTOPPED       0177            // _WSTATUS if process is stopped
#define WIFSTOPPED(x)   (_WSTATUS(x) == _WSTOPPED)
#define WSTOPSIG(x)     (_W_INT(x) >> 8)
#define WIFSIGNALED(x)  (_WSTATUS(x) != _WSTOPPED && _WSTATUS(x) != 0 && (x) != 0x13) // <-- here
#define WTERMSIG(x)     (_WSTATUS(x))
#define WIFEXITED(x)    (_WSTATUS(x) == 0)
#define WEXITSTATUS(x)  (_W_INT(x) >> 8)
#define WIFCONTINUED(x) (x == 0x13)     // 0x13 == SIGCONT
  */
  // http://stackoverflow.com/questions/1041182/why-does-my-perl-script-exit-with-137#1041309
  // says '137=128+9, which means some other process has sent you a signal 9, which is SIGKILL'
  process.exit(137);
});

process.on('SIGTERM', () => {
  process.exit(15 + 128);
});

process.on('SIGINT', () => {
  process.exit(2 + 128);
});
