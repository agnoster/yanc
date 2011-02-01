var child_process = require('child_process')

function create(app, start, remote, branch) {
    this.apiCall('Creating application "' + app +'"', ['app_create', app, start], function(data) {
        this.ok("Application created successfully")
        data.name = app
        this.dump_app(data)
        child_process.exec('git remote add ' + remote + ' "' + data.gitrepo + '"', function(err, stdout, stderr) {
            if (err) this.fatal('Could not add git remote: ' + err.message)
            this.ok('Added git remote: ' + remote)
            this.config.save({ remote: remote, branch: branch, app: app }, function(err, data) {
                if (err) this.fatal(err)
                this.ok('Saved app name, remote, and branch settings')
            }.bind(this))
        }.bind(this))
    })
}

module.exports = create
