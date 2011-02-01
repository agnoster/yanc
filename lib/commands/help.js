var child_process = require('child_process')

function help(command) {
    var page = 'nodester-client-' + (command || 'nodester')
    child_process.takeOver('man', [page])
}

module.exports = help
