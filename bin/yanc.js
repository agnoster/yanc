#!/usr/bin/env node
;(function(){

var cli = require('../lib/cli.js').enable('version', 'status').disable('help')
  , stdio = process.binding('stdio')
  , child_process = require('child_process')
  , Config = require('../lib/config.js')
  , sys = require('sys')
  , Nodester = require('nodester-api').nodester
  , prompt = require('../lib/prompt.js')

Object.prototype.keyList = function() { var a = []; for (i in this) if (this.hasOwnProperty(i)) a.unshift(i); return a }

String.prototype.pad = function(length) {
    var prepad, d, padding
    if (length < 0) length = -length, prepad = true
    d = length - this.length + 1
    if (d <= 0) return this
    padding = Array(d).join(' ')
    if (prepad) return padding + this
    return this + padding
}
Object.prototype.pad = function(length) { return this.toString().pad(length) }
function pad(val, length) { return (''+val).pad(length) }

var notimplemented = function(args, options) {
    this.fatal("Command \"" + this.command + "\" is not yet implemented")
}

function dump_app(app) {
    console.log('Name:     ' + app.name)
    console.log('Running:  ' + app.running)
    console.log('Port:     ' + app.port)
    console.log('Git repo: ' + app.gitrepo)
    console.log('Start:    ' + app.start)
    console.log('PID:      ' + app.pid)
}

child_process.takeOver = function(cmd, args) {
    var fds = [ stdio.stdinFD || 0
              , stdio.stdoutFD || 1
              , stdio.stderrFD || 2
              ]
    return child_process.spawn(cmd, args, { customFds: fds })
}

var commands = {
    help: { doc: "Read the man page for a given command", params: ['command'] }
,   config: { doc: [["", "Show configuration information"], ["<key>", "Read the value of the configuration key"], ["<key> <value>", "Set the value of the given key"]], params: ['key', 'value'] }
,   status: { doc: "Get status of the service", params: ['base'], config: ['base'] }
,   coupon: { doc: "Request a coupon for registration", params: ['email'], config: ['email', 'base'] }
,   register: { doc: ["<coupon>", "Register a user"], params: ['coupon', 'user', 'email', 'key', 'base'], config: ['email', 'key'], auth: true }
,   unregister: { doc: "Delete the user", params: ['user'], config: ['base'], auth: true }
,   info: { doc: "Get information about the current app", params: ['app'], config: ['app'], auth: true }
,   logs: { doc: "Get logs for the current app", params: ['app'], config: ['app'], auth: true }
,   start: { doc: "Start the app", params: ['app'], config: ['app'], auth: true }
,   restart: { doc: "Restart the app", params: ['app'], config: ['app'], auth: true }
,   stop: { doc: "Stop the app", params: ['app'], config: ['app'], auth: true }
,   push: { doc: "Push the app using git", params: ['remote', 'branch'], config: ['remote', 'branch'] }
,   link: { doc: "Create a git remote to push to", params: ['remote', 'app'], config: ['remote', 'app'], auth: true }
,   password: { doc: "Prompt for a password and store it" }
,   list: { doc: "List all apps", params: ['user', 'base'], auth: true }
,   create: { doc: "Create an app on the server", params: ['app', 'start', 'remote', 'branch'], config: ['app', 'start', 'remote', 'branch'], auth:true }
,   "delete": { doc: "Delete an app on the server", params: ['app', 'remote'], config: ['app', 'remote'], auth: true }
,   npm: { doc: [["install <package>", "Install an npm package on the server"], ["uninstall <package>", "Uninstall the given package"], ["update <package>", "Update the package"], ["deps", "Install all dependencies on server declared in package.json"]], params: ['action', 'package', 'app'], config: ['app'], auth: true }
,   domain: { doc: [["add <domain>", "Add a domain alias"], ["delete <domain>", "Remove domain alias"]], params: ['action', 'domain', 'app'], config: ['app'], auth: true }
}

var require_password = function(config, mustConfirm, cb) {
    // confirm is optional
    if (!cb) cb = mustConfirm, mustConfirm = false

    var confirm = function(pass) {
        prompt.password('Confirm password: ', function(data) {
            if (data == pass) return cb(pass)
            cli.error('Passwords do not match!')
            return require_password(config, mustConfirm, cb)
        })
    }

    if (!mustConfirm) {
        confirm = function(pass) {
            cb(pass)
        }
    }

    if (config.pass) {
        console.log('Password:         ' + (config.pass.replace(/./g, '*')) + '    # from config')
        return confirm(config.pass)
    }
    prompt.password('Password: ', function(pass) {
        confirm(pass)
    })
}

cli.parse(null, commands.keyList())

function usage(name) {
    var command = commands[name]
    var doc = command.doc
    if (typeof doc != 'object') {
        doc = ['', doc]
    }
    if (typeof doc[0] != 'object') {
        doc = [doc]
    }
    for (var i = 0; i < doc.length; i++) {
        console.log('  ' + (name + ' ' + doc[i][0]).pad(35) + ' # ' + doc[i][1])
    }
}

cli.main(function(args, options){
    var cliname = 'yanc'
    if (options.cli) cliname = options.cli
    cli.setApp(cliname, '0.0.2')
    this.require_password = require_password
    this.dump_app = dump_app

    if (!this.command) {
        console.log('Usage: ' + cliname + ' <command> [arguments]')
        console.log('Commands: ')
        for (var cmd in commands) {
            if (!commands.hasOwnProperty(cmd)) continue
            usage(cmd)
        }
        process.exit(1)
    }

    this.apiCall = function(desc, args, cb) {
        var fn = args.shift()
        this.spinner('# ' + desc + '... ')
        function _cb(err, data) {
            // Special case for status, which returns a bogus... status. Ironic.
            if (fn == 'status' && data && data.status) err = null
            if (err) {
                this.spinner('# ' + desc + "... failed\n", true)
                this.fatal(err.message)
            }
            this.spinner('# ' + desc + "... done\n", true)
            cb.call(this, data)
        }
        this.api[fn].apply(this.api, args.concat(_cb.bind(this)))
    }

    var command = commands[this.command]
    if (command) {
        if (typeof(command) == 'function') {
            this.config = new Config(options, cliname)
            return command.apply(this, [args, options])
        }
        if (typeof(command) == 'object') {
            this.options = options
            var fn = require('../lib/commands/' + this.command + '.js')
            if (command.auth) {
                if (!command.config) command.config = []
                command.config = command.config.concat('user', 'pass', 'base')
            }
            if (command.params) {
                for (var i = 0; i < args.length && i < command.params.length; i++) {
                    options[command.params[i]] = args[i]
                }
            }
            this.config = new Config(options, cliname)
            if (command.config) {
                this.config.vars(command.config, function(err, conf) {
                    if (err) return this.fatal(err.message)
                    this.conf = conf
                    if (conf.user && conf.pass) {
                        this.api = new Nodester(conf.user, conf.pass, conf.base)
                    } else {
                        this.api = new Nodester('', '', conf.base)
                    }
                    // propagate config variables into parameter list
                    for (var i = 0; i < command.params.length; i++) {
                        if (!conf.hasOwnProperty(command.params[i])) continue
                        args[i] = conf[command.params[i]]
                    }
                    fn.apply(this, args)
                }.bind(this))
            } else {
                fn.apply(this, args)
            }
        }
    }
    else this.fatal("could not find command " + this.command + " - try `nodester help`")
})

})()
