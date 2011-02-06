function logs(app) {
    this.apiCall('Getting logs for app "' + app + '"', ['app_logs', app], function(data) {
        for (var i = 0; i < data.lines.length; i++) {
            console.log(data.lines[i])
        }
    })
}

module.exports = logs

