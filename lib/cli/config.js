var child_process = require('child_process')
  , git = require('../git')

function Config(options) {
    var _git

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

    var defaults =
    { user: function (cb) {
        child_process.exec('whoami', function(err, stdout, stderr) {
            cb(err, stdout.trim(), 'whoami')
            })
        }
    , email: function (cb) {
        gitConfig(function(err, data) {
            cb(err, data['user.email'], 'git config user.email')
            })
        }
    , root: function (cb) {
        cb(null, 'http://api.nodester.com/', 'default')
        }
    , key: null // check for ~/.ssh/id_[rd]sa.pub
    , app: null // check package.json, dir name
    , start: null // check package.json, server.js, app.js
    , remote: function (cb) {
        cb(null, 'nodester', 'default')
        }
    , branch: function (cb) {
        cb(null, 'master', 'default')
        }
    , pass: null // prompt
    }

    this.git = gitConfig
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

module.exports = Config

