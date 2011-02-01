var child_process = require('child_process')

var git = function(args, cb) {
    function _git(args, cb) {
        child_process.exec('git ' + args, function() {
            var next = git._Q.pop()
            if (next) _git.apply(null, next)
            else git._Q = null
            cb.apply(null, arguments)
        })
    }

    if (git._Q) { //need to queue
        git._Q.unshift(arguments)
    } else {
        git._Q = []
        _git(args, cb)
    }
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
    git.config((global ? '--global ' : '') + '"' + key + '" "' + value + '"', cb)
}
git.config.unset = function(key, global, cb) {
    git.config((global ? '--global ' : '') + '--unset-all "' + key + '"', cb)
}

module.exports = git
