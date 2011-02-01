function stop(app) {
    this.apiCall('Stopping app "' + app + '"', ['app_stop', app], function(data) {
        this.ok('App ' + app + ' stopped')
    })
}

module.exports = stop
