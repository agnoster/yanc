var child_process = require('child_process')

function del(app, remote) {
    this.apiCall('Deleting application "' + app + '"', ['app_delete', app], function(data) {
        this.ok("Application deleted")
        child_process.exec('git remote rm ' + remote, function(err, stdout, stderr) {
            if (err) this.fatal("Could not remove remote: " + remote)
            this.ok('Removed remote "' + remote + '"')
        }.bind(this))
    })
}

module.exports = del
