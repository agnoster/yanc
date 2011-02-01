function start(app) {
    this.apiCall('Starting app "' + app + '"', ['app_start', app], function(data) {
        this.ok('App ' + app + ' started')
    })
}

module.exports = start
