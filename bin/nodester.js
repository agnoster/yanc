#!/usr/bin/env node
;(function(){
var cli = require('cli').enable('version', 'status')
  , stdio = process.binding('stdio')
  , child_process = require('child_process')
  , nodester = require('../nodester-client')

cli.setApp('nodester', '0.0.1')

cli.parse(null, [ 'config', 'coupon', 'help', 'start', 'stop', 'register', 'push', 'create', '' ])

function man(page) {
    var fds = [ stdio.stdinFD || 0
              , stdio.stdoutFD || 1
              , stdio.stderrFD || 2
              ]
    child_process.spawn('man', [page], { customFds: fds })
}

cli.main(function(args,options){
   if (cli.command == 'help') {
       man('nodester-client-' + (this.args.shift() || 'nodester'))
   }
})
})()
