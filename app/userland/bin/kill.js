'use strict';

// kill processes

const pids = process.argv.slice(2);

// TODO: accept flag to change signal, [-s sigspec | -n signum | -sigspec] see https://github.com/dthree/cash/blob/master/src/commands/kill.js
// and on Unix, the default kill(1) signal is actually SIGTERM
const signal = 'SIGKILL';

for (let pidString of pids) {
  const pid = parseInt(pidString, 10);

  // TODO: check return value, but problem: async (not Node.js API, but Nodeachrome API)
  process.kill(pid, signal);
}

// TODO
//process.exit(0);
