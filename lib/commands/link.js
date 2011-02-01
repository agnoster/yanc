var child_process = require('child_process')

function link(remote, app) {
    this.apiCall('Adding remote "' + remote + '" for app "' + app + '"', ['app_info', app], function(app) {
        child_process.exec('git remote add ' + remote + ' "' + app.gitrepo + '"', function(err, stdout, stderr) {
            if (err) this.fatal('Could not add git remote: ' + err.message)
            this.ok('Added git remote: ' + remote + ' -> ' + app.gitrepo)
            this.config.save({ remote: remote }, function(err, data) {
                if (err) this.fatal('Could not update config accordingly')
                this.ok('Set default deployment remote to "' + remote + '"')
            }.bind(this))
        }.bind(this))
    })
}

module.exports = link
