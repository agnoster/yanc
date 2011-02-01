#!/usr/bin/env node
;(function(){
var cli = require('../lib/cli/cli.js').enable('version', 'status').disable('help')
  , stdio = process.binding('stdio')
  , child_process = require('child_process')
  , nodester = require('../nodester-client')
  , Config = require('../lib/cli/config.js')
  , sys = require('sys')
  , Nodester = require('nodester-api').nodester
  , prompt = require('../lib/cli/prompt.js')

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

function dump_app(app) {
    console.log('Name:     ' + app.name)
    console.log('Running:  ' + app.running)
    console.log('Port:     ' + app.port)
    console.log('Git repo: ' + app.gitrepo)
    console.log('Start:    ' + app.start)
    console.log('PID:      ' + app.pid)
}

function takeOver(cmd, args) {
    var fds = [ stdio.stdinFD || 0
              , stdio.stdoutFD || 1
              , stdio.stderrFD || 2
              ]
    child_process.spawn(cmd, args, { customFds: fds })
}

var commands = {

    help: function(args, options) {
        var page = 'nodester-client-' + (this.args.shift() || 'nodester')
        takeOver('man', [page])
    }
,   config: function(args, options) {
        this.config.noprompt = true
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
            } else { // only key specified
                if (options.unset) {
                    this.config.unset(key, options.global, function(err) {
                        if (err && err.code == 5) this.fatal("Key doesn't exist")
                        if (err) this.fatal("Could not delete conf key: " + err.message)
                        this.ok("Deleted conf key: " + key)
                    }.bind(this))
                } else {
                    this.config.get(key, function(err, key, value, source) {
                        if (err) return this.fatal(err)
                        if (key == 'pass') value = value.replace(/./g, '*')
                        printvar(key, value, source)
                    }.bind(this))
                }
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
        this.config.vars(['email', 'base'], function(err, conf) {
            if (!email) email = conf.email
            if (err) cli.fatal(err)
            this.spinner('# Requesting coupon for ' + email + '... ')
            var api = new Nodester('', '', conf.base)
            api.coupon_request(email, function(err, data){
                if (err) {
                    this.spinner('# Requesting coupon for ' + email + "... failed!\n", true)
                    this.fatal(err.message)
                } else {
                    this.spinner('# Requesting coupon for ' + email + "... done!\n", true)
                    this.ok('Coupon requested. You will receive an email when capacity allows.')
                    this.config.set('email', conf.email, true, function(err, key, value) {
                        this.ok('Saved ' + value + ' as your email address in the global config')
                    }.bind(this))
                }
            }.bind(this))
        }.bind(this))
    }
,   info: function(args, options) {
        this.config.vars(['base', 'user', 'pass', 'app'], function(err, conf) {
            var n = new Nodester(conf.user, conf.pass, conf.base)
            this.spinner("# getting app info... ")
            n.app_info(conf.app, function(err, data) {
                this.spinner("# getting app info... done!\n", true)
                if (err) this.fatal(err.message)
                data.name = conf.app
                dump_app(data)
            }.bind(this))
        }.bind(this))
    }
,   start: function(args, options) {
        this.config.vars(['base', 'user', 'pass', 'app'], function(err, conf) {
            var n = new Nodester(conf.user, conf.pass, conf.base)
            this.spinner("# starting app... ")
            n.app_start(conf.app, function(err, data) {
                this.spinner("# starting app... done!\n", true)
                if (err) this.fatal(err.message)
                this.ok('app ' + conf.app + ' started')
            }.bind(this))
        }.bind(this))
    }
,   restart: function(args, options) {
        this.config.vars(['base', 'user', 'pass', 'app'], function(err, conf) {
            var n = new Nodester(conf.user, conf.pass, conf.base)
            this.spinner("# restarting app... ")
            n.app_restart(conf.app, function(err, data) {
                this.spinner("# restarting app... done!\n", true)
                if (err) this.fatal(err.message)
                this.ok('app ' + conf.app + ' restarted')
            }.bind(this))
        }.bind(this))
    }
,   stop: function(args, options) {
        this.config.vars(['base', 'user', 'pass', 'app'], function(err, conf) {
            var n = new Nodester(conf.user, conf.pass, conf.base)
            this.spinner("# stopping app... ")
            n.app_stop(conf.app, function(err, data) {
                this.spinner("# stopping app... done!\n", true)
                if (err) this.fatal(err.message)
                this.ok('app ' + conf.app + ' stopped')
            }.bind(this))
        }.bind(this))
    }
,   register: function(args, options) {
        var coupon = args.shift()
        if (!coupon) this.fatal('Must include a coupon code!')
        this.info('Registering user with the following information:')
        this.config.noprompt = true
        this.config.vars(['base', 'email', 'user', 'pass', 'key'], function(err, conf) {
            if (err) this.fatal(err)
            console.log('Username: ' + conf.user)
            console.log('   Email: ' + conf.email)
            console.log('  Coupon: ' + coupon)
            console.log(' SSH Key: ' + conf.key)
            console.log('  Server: ' + conf.base)
            this.info('If anything is incorrect, abort with Ctrl-C and use "nodester config"')
            require_password(conf, true, function(pass) {
                conf.pass = pass
                var api = new Nodester('', '', conf.base)
                this.spinner('# creating user... ')
                api.user_create(conf.user, conf.pass, conf.email, conf.key, coupon, function(err, data) {
                    if (err) {
                        this.spinner('# creating user... failed!'+"\n", true)
                        this.fatal(err.message)
                    } else {
                        this.spinner('# creating user... done!'+"\n", true)
                        this.ok('User created')
                        this.config.save({ user: conf.user, email: conf.email, key: conf.key, base: conf.base }
                                         , true, function(err, data) {
                            if (err) this.fatal(err.message)
                            this.ok('Saved user information in global config')
                        }.bind(this))
                    }
                }.bind(this))
            }.bind(this))
        }.bind(this))
    }
,   push: function(args, options) {
        this.config.vars(['branch', 'remote'], function(err, conf) {
            console.log('# pushing branch \"' + conf.branch + '\" to remote \"' + conf.remote + "\"... \n")
            takeOver('git', ['push', conf.remote, conf.branch+':master'])
        }.bind(this))
        
    }
,   save_pass: function(args, options) {
        this.info('Note: this will save your password in the global git config')
        this.config.vars(['pass'], function(err, conf) {
            require_password(conf, true, function(pass) {
                this.config.set('pass', pass, true, function(err, data) {
                    if (err) this.fatal('Failed to save password')
                    this.ok('Saved password')
                }.bind(this))
            }.bind(this))
        }.bind(this))
    }
,   list: function(args, options) {
        this.config.vars(['base', 'user', 'pass'], function(err, conf) {
            var api = new Nodester(conf.user, conf.pass, conf.base)
            this.spinner('# listing apps... ')
            api.apps_list(function(err, data) {
                if (err) {
                    this.spinner("# listing apps... failed\n", true)
                    this.fatal(err.message)
                } else {
                    this.spinner("# listing apps... done\n", true)
                    if (data.length) {
                        console.log(data)
                    } else {
                        this.info('No apps found')
                    }
                }
            }.bind(this))
        }.bind(this))
    }
,   update_user: function(args, options) {
        this.config.vars(['base', 'user', 'pass', 'key'], function(err, conf) {
            this.ok('curl -X PUT -u "' + conf.user + ':' + conf.pass + '" --data-urlencode "rsakey@' + conf.key + '" http://' + conf.base + '/user')
        }.bind(this))
    }
,   create: function(args, options) {
        this.config.vars(['base', 'user', 'pass', 'app', 'start', 'branch', 'remote'], function(err, conf) {

            var cmd = '-X POST -u "' + conf.user + ':' + conf.pass + '" -d "appname='
                    + conf.app + '&start=' + conf.start + '" http://' + conf.base + '/app'
            console.log(cmd);
            var api = new Nodester(conf.user, conf.pass, conf.base)
            this.spinner("# creating application " + conf.app + "... ")
            api.app_create(conf.app, conf.start, function(err, app) {
                if (err) {
                    this.spinner("# creating application " + conf.app + "... failed\n", true)
                    this.fatal(err.message)
                } else {
                    this.spinner("# creating application " + conf.app + "... done\n", true)
                    this.ok("Application created successfully")
                    app.name = conf.app
                    dump_app(app)
                    child_process.exec('git remote add ' + conf.remote + ' "' + app.gitrepo + '"', function(err, stdout, stderr) {
                        if (err) this.fatal('Could not add git remote: ' + err.message)
                        this.ok('Added git remote: ' + conf.remote)
                        this.config.save({ remote: conf.remote, branch: conf.branch, app: conf.app }, function(err, data) {
                            if (err) this.fatal(err)
                            this.ok('Saved app name, remote, and branch settings')
                        }.bind(this))
                    }.bind(this))
                }
            }.bind(this))
        }.bind(this))
    }
,   "delete": function(args, options) {
        this.config.vars(['base', 'user', 'pass', 'app', 'remote'], function(err, conf) {
            var api = new Nodester(conf.user, conf.pass, conf.base)
            this.spinner("# deleting application " + conf.app + "... ")
            api.app_delete(conf.app, function(err, app) {
                this.spinner("# deleting application " + conf.app + "... done\n", true)
                if (err) this.fatal(err.message)
                this.ok("Application deleted")
            }.bind(this))
        }.bind(this))
    }
,   npm: notimplemented
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
cli.main(function(args,options){
    this.config = new Config(options)
    this.require_password = require_password
    this.cmd = function(desc, cmd, cb) {
        this.spinner("# " + desc + "... ")
        child_process.exec(cmd, function(err, stdout, stderr) {
            this.spinner("# " + desc + "... done!\n", true)
            cb(err, stdout, stderr)
        }.bind(this))
    }.bind(this)
    this.curl = function(desc, params, cb) {
        this.cmd(desc, 'curl ' + params, function(err, stdout, stderr) {
            if (err) return cb(err, stderr)
            cb(null, JSON.parse(stdout))
        }.bind(this))
    }.bind(this)
    if (commands[this.command]) commands[this.command].apply(this, [args, options])
    else this.fatal("could not find command " + this.command + " - try `nodester help`")
})
})()
