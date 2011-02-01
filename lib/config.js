var child_process = require('child_process')
  , git = require('./git.js')
  , prompt = require('./prompt.js')
  , fs = require('fs')
  , path = require('path')

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

function Config(options, cliname) {
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
            if (err) return cb(err, null)
            fs.readFile(dir + '/package.json', function(err, data) {
                if (err) {
                    _pkg = {}
                    return cb({ message: "No package.json file found" }, _pkg)
                }
                try {
                    _pkg = JSON.parse(data)
                } catch (e) {
                    _pkg = {}
                    return cb({ message: "Could not parse package.json" }, _pkg)
                }
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
            if (dir == '/') return cb(null, process.cwd() + '/')
            fs.stat(dir + '/.git', function(err, data) {
                if (err) return find_root(path.resolve(dir, '..'), cb)
                cb(null, dir)
            })
        }

        find_root(process.cwd() + '/', function(err, dir) {
            cb(err, dir, 'walking from the working directory')
        })
        }
    , email: function (cb) {
        gitConfig(function(err, data) {
            cb(err, data['user.email'], 'git config user.email')
            })
        }
    , base: function (cb) {
        if (this.cliname == 'bejesus') return cb(null, 'bejes.us', 'default for bejesus')
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
        this.get('dir', function(err, key, dir) {
            var match = /(\w+)\/?$/.exec(process.cwd())
              , appname = ''
            if (match) appname = match[1]
            this.pkg(function(err, data) {
                if (err) return cb(null, appname, 'directory name')
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
                            if (data.main) return cb(null, /\.js$/.exec(data.main) ? data.main : (data.main + '.js'))
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
        cb(null, cliname, 'default')
        }
    , branch: function (cb) {
        git('symbolic-ref HEAD', function(err, data) {
            if (err) return cb(null, 'master', 'default')
            cb(null, data.trim().replace('refs/heads/', ''), 'current branch')
        })}
    , pass: function (cb) {
        if (this.noprompt) return cb(null, '', 'not defined')
        prompt.password('Password: ', function(pass) {
            cb(null, pass, 'prompted')
        })
        }
    }

    this.clearGitCache = function () { _git = null }

    this.git = gitConfig
    this.pkg = packageJSON
    this.options = options
    this.defaults = defaults
    this.cliname = cliname
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
    var K = (this.cliname + '_' + key).toUpperCase()
    if (process.env[K])
        return cb(null, key, process.env[K], '$' + K)
    this.git(function(err, data) {
        if (err)
            return cb(err, key, null)
        K = this.cliname + '.' + key
        if (data[K])
            return cb(null, key, data[K], 'git config ' + K)
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
    git.config.set(this.cliname + '.' + key, value, global, function(err) {
        if (err) return cb(err)
        this.clearGitCache()
        cb(null, key, value, 'successfully set')
    }.bind(this))
}

Config.prototype.unset = function(key, global, cb) {
    git.config.unset(this.cliname + '.' + key, global, function(err) {
        if (err) return cb(err)
        this.clearGitCache()
        cb(null, key, 'successfully unset')
    }.bind(this))
}

Config.prototype.vars = function(keys, cb) {
    this.prompt = true
    var values = {}
      , left = keys.length

    var _cb = function(key) {
        return function(err, key, data) {
            --left
            if (err) return cb(err, null)
            values[key] = data
            if (left === 0) {
                cb(null, values)
            }
        }
    }

    keys.every(function(key) {
        this.get(key, _cb(key))
        return true
    }.bind(this))
}

Config.prototype.save = function(data, global, cb) {
    if (!cb) cb = global, global = false
    var left = 0
    
    function _cb(err, data) {
        --left
        if (err) {
            left = 0
            return cb(err)
        }
        if (left === 0) {
            return cb(null)
        }
    }

    for (var key in data) {
        if (!data.hasOwnProperty(key)) continue
        ;++left
        this.set(key, data[key], global, _cb)
    }
}


module.exports = Config

