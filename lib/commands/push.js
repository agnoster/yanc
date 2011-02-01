var child_process = require('child_process')

function push(remote, branch) {
    console.log('# Pushing branch \"' + branch + '\" to remote \"' + remote + "\"... \n")
    child_process.takeOver('git', ['push', remote, branch+':master']).on('exit', function(code){
        if (code) this.fatal('Failed to push')
        this.ok('Push successful')
    }.bind(this))
}

module.exports = push
