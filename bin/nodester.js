#!/usr/bin/env node
;(function(){
var cli = require('../lib/cli/cli.js').enable('version', 'status').disable('help')
  , stdio = process.binding('stdio')
  , child_process = require('child_process')
  , nodester = require('../nodester-client')
  , Config = require('../lib/cli/config.js')
  , sys = require('sys')

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
,   coupon: function(args, options) {
        var email = args.shift()
        this.config.vars(['email'], function(err, conf) {
            if (email) conf.email = email
            if (err) cli.fatal(err)
            this.spinner('# Requesting coupon for ' + conf.email + '... ')
            this.spinner('# Requesting coupon for ' + conf.email + "... done!\n", true)
            this.ok('Coupon requested. You will receive an email when capacity allows.')
            this.config.set('email', conf.email, true, function(err, key, value) {
                this.ok('Saved ' + value + ' as your email address in the global config')
            }.bind(this))
        }.bind(this))
    }
,   start: function(args, options) {
        this.config.vars(['base', 'user', 'pass', 'app'], function(err, conf) {
            this.ok('curl -X PUT -u "' + conf.user + ':' + conf.pass + '" -d "appname=' + conf.app + '&running=true" http://' + conf.base + '/app')
        }.bind(this))
    }
,   stop: function(args, options) {
        this.config.vars(['base', 'user', 'pass', 'app'], function(err, conf) {
            this.ok('curl -X PUT -u "' + conf.user + ':' + conf.pass + '" -d "appname=' + conf.app + '&running=false" http://' + conf.base + '/app')
        }.bind(this))
    }
,   register: function(args, options) {
        var coupon = args.shift()
        if (!coupon) this.fatal('Must include a coupon code!')
        console.log('# Registering user:')
        this.config.vars(['base', 'email', 'user', 'pass', 'key'], function(err, conf) {
            if (err) this.fatal(err)
            console.log('Username: ' + conf.user)
            console.log('Email:    ' + conf.email)
            console.log('SSH Key:  ' + conf.key)
            stdin = process.openStdin()
            stdin.setEncoding('utf8')
            sys.print('Confirm password: ')
            stdin.on('data', function(password){
                cli.ok('curl -X POST -d "user=' + conf.user + '&password=' + conf.pass + '&email=' + conf.email + '&rsakey=' + conf.key + '" http://' + conf.base + '/user')
                cli.spinner('# creating user... ')
                cli.spinner('# creating user... done!'+"\n", true)
                cli.ok('User created')
                stdin.destroy()
            })
        }.bind(this))
    }
,   push: function(args, options) {
        this.config.vars(['branch', 'remote'], function(err, conf) {
            this.ok('git push ' + conf.remote + ' ' + conf.branch + ':master')
        }.bind(this))
        
    }
,   update_user: function(args, options) {
        this.config.vars(['base', 'user', 'pass', 'key'], function(err, conf) {
            this.ok('curl -X PUT -u "' + conf.user + ':' + conf.pass + '" --data-urlencode "rsakey@' + conf.key + '" http://' + conf.base + '/user')
        }.bind(this))
    }
,   create: function(args, options) {
        this.config.vars(['base', 'user', 'pass', 'app', 'start', 'branch', 'remote'], function(err, conf) {
            this.ok('curl -X POST -u "' + conf.user + ':' + conf.pass + '" -d "appname=' + conf.app + '&start=' + conf.start + '" http://' + conf.base + '/app')
            this.ok('git add remote ' + conf.remote + ' <url_from_curl>')
            this.config.save({ remote: conf.remote, branch: conf.branch }, function(err, data) {
                if (err) cli.fatal(err)
                cli.ok('Saved remote and branch settings')
            })
        }.bind(this))
    }
,   npm: notimplemented
}

cli.parse(null, commands.keyList())
cli.main(function(args,options){
    this.config = new Config(options)
    if (commands[this.command]) commands[this.command].apply(this, [args, options])
    else this.fatal("could not find command " + this.command + " - try `nodester help`")
})
})()
