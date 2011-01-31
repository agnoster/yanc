#!/usr/bin/env node
;(function(){
var cli = require('../lib/cli/cli.js').enable('version', 'status').disable('help')
  , stdio = process.binding('stdio')
  , child_process = require('child_process')
  , nodester = require('../nodester-client')
  , Config = require('../lib/cli/config.js')

cli.setApp('nodester', '0.0.1')

Object.prototype.keyList = function() { var a = []; for (i in this) if (this.hasOwnProperty(i)) a.unshift(i); return a }

String.prototype.pad = function(length) {
    var d = length - this.length + 1
    return (d > 0) ? this + Array(d).join(' ') : this
}
function pad(val, length) { return (''+val).pad(length) }

var notimplemented = function(args, options) {
    this.fatal("Command \"" + this.command + "\" is not yet implemented")
}

var commands = {

    help: function(args, options) {
        var page = 'nodester-client-' + (this.args.shift() || 'nodester')
        var fds = [ stdio.stdinFD || 0
                , stdio.stdoutFD || 1
                , stdio.stderrFD || 2
                ]
        child_process.spawn('man', [page], { customFds: fds })
    }

,   config: function(args, options) {
        function printvar(key, val, source) {
            console.log(pad(key, 8) + ' ' + pad(val, 50) + ' # ' + source)
        }
        if (key = args.shift()) {
            if (match = /(\w+)=([\"\']?)(.*)\2$/.exec(key)) {
                key = match[1]
                args.unshift(match[3])
            }
            if (val = args.shift()) {
                this.config.set(key, val, options.global, function(err) {
                    if (err) this.fatal("Error: " + err.message)
                    this.ok("Set " + key + "=\"" + val + "\"")
                }.bind(this))
            } else {
                this.config.get(key, function(err, key, value, source) {
                    if (err) return this.fatal(err)
                    if (key == 'pass') value = value.replace(/./g, '*')
                    printvar(key, value, source)
                }.bind(this))
            }
        } else {
            this.config.list(function(err, key, value, source) {
                if (options.freeze) {
                    this.config.set(key, value, false, function(err, data) {
                        if (!err) cli.ok('set ' + key + '="' + value + '"')
                        else cli.error('failed setting ' + key)
                    }.bind(this))
                } else {
                    if (key == 'pass') value = value.replace(/./g, '*')
                    printvar(key, value, source)
                }
            }.bind(this))
        }
    }
,   coupon: notimplemented
,   start: notimplemented
,   stop: notimplemented
,   register: notimplemented
,   push: notimplemented
,   create: notimplemented
,   npm: notimplemented
}

cli.parse(null, commands.keyList())


cli.main(function(args,options){
    this.config = new Config(options)
    if (commands[this.command]) commands[this.command].apply(this, [args, options])
    else this.fatal("could not find command " + this.command + " - try `nodester help`")
})
})()
