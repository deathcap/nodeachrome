'use strict';

const syscall = require('../syscall').syscall;

syscall({cmd: 'reboot'});
