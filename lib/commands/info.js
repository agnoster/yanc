function info(app) {
    this.apiCall('Getting info for app "' + app + '"', ['app_info', app], function(data) {
        data.name = app
        this.dump_app(data)
    })
}

module.exports = info
