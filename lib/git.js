var child_process = require('child_process')

var git = function(args, cb) {
    child_process.exec('git ' + args, cb)
}

var cmd = function(string) {
    return function(args, cb) {
        return git(string + ' ' + args, cb)
    }
}

git.config = cmd('config')
git.config.list = cmd('config -l')
git.config.get = cmd('config --get')
git.config.set = function(key, value, global, cb) {
    git.config('"' + key + '" "' + value + '"' + (global ? ' --global' : ''), cb)
}

module.exports = git
