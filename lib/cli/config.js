var child_process = require('child_process')
  , git = require('../git')
  , fs = require('fs')

// Call a set of prioritized functions. Call
// cb with the first function in the priority list
// that returns successfully
function fallback(fns, cb) {
    var results = [] // we'll collect results here
      , accept = 0 // first result we'll accept a success from
      , last = fns.length - 1 // if we reach this, all is lost

    // private callback
    var _cb = function(idx) {
        return function(err, data) {
            if (idx == accept) {
                if (!err) return cb(null, data, idx) // we're done
                while (accept < last) {
                    accept++
                    if (!results[accept]) return // we'll have to wait for more data
                    if (!results[accept].err) return cb(null, results[accept].data, accept)
                    // if we're here, the result failed
                }
                // if we land *here*, we struck out
                cb({ message: "Out of options" }, null, null)
            } else {
                results[idx] = { err: err, data: data }
            }
        }
    }

    fns.every(function(fn, idx) {
        fn.call(this, _cb(idx))
        return true
    })

}

function Config(options) {
    var _git = null
      , _pkg = null

    // Get config from git -> err, {conf: vars}
    var gitConfig = function(force, cb) {
        // force parameter is optional
        if (!cb) cb = force, force = false

        // use cache if available
        if (!force && _git) return cb(null, _git)

        git.config.list('', function(err, stdout, stderr) {
            if (err) cb(err, null)
            _git = {}
            var re = /([\w.]+)\=(.*)/g
            while (match = re.exec(stdout)) _git[match[1]] = match[2]
            cb(null, _git)
        })
    }

    var packageJSON = function(cb) {
        if (_pkg) return cb(null, _pkg)

        this.get('dir', function(err, key, dir) {
            if (err) cb(err, null)
            fs.readFile(dir + '/package.json', function(err, data) {
                _pkg = JSON.parse(data)
                cb(null, _pkg)
            })
        })
    }

    var defaults =
    { user: function (cb) {
        child_process.exec('whoami', function(err, stdout, stderr) {
            cb(err, stdout.trim(), 'whoami')
            })
        }
    , dir: function (cb) {
        function find_root(dir, cb) {
            fs.stat(dir + '/package.json', function(err, data) {
                if (err) return find_root(dir + '/..', cb)
                fs.realpath(dir, cb)
            })
        }

        find_root('.', function(err, dir) {
            cb(err, dir, 'walking from the working directory')
        })
        }
    , email: function (cb) {
        gitConfig(function(err, data) {
            cb(err, data['user.email'], 'git config user.email')
            })
        }
    , base: function (cb) {
        cb(null, 'api.nodester.com', 'default')
        }
    , key: function (cb) { // check for ~/.ssh/id_[rd]sa.pub
        var home = process.env['HOME']
          , files = [ home + '/.ssh/id_rsa.pub', home + '/.ssh/id_dsa.pub' ]

        fallback([ function(cb) { fs.stat(files[0], cb) }
                 , function(cb) { fs.stat(files[1], cb) }
                 ], function(err, data, idx) {
                     if (err) return cb(err, null, 'could not find a keyfile')
                     cb(err, files[idx], 'automatically located')
                 })

        }
    , app: function (cb) { // check package.json, dir name
        this.git('dir', function(err, key, dir) {
            var match = /(\w+)\/?$/.exec(process.cwd())
              , appname = ''
            if (match) appname = match[1]
            this.pkg(function(err, data) {
                if (err) cb(err, appname, 'directory name')
                if (data.name) return cb(null, data.name, 'package.json.name')
                cb(null, appname, 'directory name')
            }.bind(this))
        }.bind(this))
        }
    , start: function (cb) { // check package.json, server.js, app.js
        this.get('dir', function(err, key, dir) {
            fallback(
                    [ function(cb) {
                        this.pkg(function(err, data) {
                            if (err) cb(err, data)
                            if (data.main) return cb(null, data.main)
                            cb({ message: 'could not identify main in package.json' })
                        })}.bind(this)
                    , function(cb) {
                        fs.stat(dir + '/server.js', function(err,data) {
                            if (err) cb(err, data)
                            cb(null, 'server.js')
                        })}
                    , function(cb) {
                        fs.stat(dir + '/app.js', function(err,data) {
                            if (err) cb(err, data)
                            cb(null, 'app.js')
                        })}
                    ], function(err, data, idx) {
                        if (err) return cb(err, null, 'could not find a start file')
                        cb(err, data, (idx) ? 'checked working directory' : 'package.json.main')
                    })
            }.bind(this))
        }
    , remote: function (cb) {
        cb(null, 'nodester', 'default')
        }
    , branch: function (cb) {
        cb(null, 'master', 'default')
        }
    , pass: null // prompt
    }

    this.clearGitCache = function () { _git = null }

    this.git = gitConfig
    this.pkg = packageJSON
    this.options = options
    this.defaults = defaults
}

Config.prototype.getDefault = function(key, cb) {
    if (!this.defaults[key]) return cb(null, key, '', 'not found')
    this.defaults[key].call(this, function(err, value, source) {
        cb(err, key, value, source)
    })
}

Config.prototype.get = function(key, cb) {
    if (this.options[key])
        return cb(null, key, this.options[key], '--'+key)
    if (process.env['NODESTER_' + key.toUpperCase()])
        return cb(null, key, process.env['NODESTER_' + key.toUpperCase()], "$NODESTER_" + key.toUpperCase())
    this.git(function(err, data) {
        if (err)
            return cb(err, key, null)
        if (data['nodester.' + key])
            return cb(null, key, data['nodester.' + key], 'git config nodester.'+key)
        return this.getDefault(key, cb)
    }.bind(this))
}

Config.prototype.list = function(cb) {
    for (key in this.defaults) {
        if (this.defaults.hasOwnProperty(key)) {
            this.get(key, cb)
        }
    }
}

Config.prototype.set = function(key, value, global, cb) {
    git.config.set('nodester.' + key, value, global, function(err) {
        if (err) return cb(err)
        this.clearGitCache()
        cb(null, key, value, 'successfully set')
    }.bind(this))
}

module.exports = Config

