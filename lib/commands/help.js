var child_process = require('child_process')

function help(command) {
    var page = 'yanc'
    if (command) page = 'yanc-' + command
    child_process.takeOver('man', [page])
}

module.exports = help
