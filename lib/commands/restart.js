function restart(app) {
    this.apiCall('Restarting app "' + app + '"', ['app_restart', app], function(data) {
        this.ok('App ' + app + ' restarted')
    })
}

module.exports = restart
