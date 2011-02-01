function status(base) {
    if (!base) base = this.conf.base
    this.apiCall('Checking status on ' + base, ['status'], function(data) {
        if (data.status == 'up') {
            this.ok('The system is up!')
            console.log("Apps hosted:  " + data.appshosted.pad(-7))
            console.log("Apps running: " + data.appsrunning.pad(-7))
        } else {
            this.fatal('The system is down')
        }
    })
}

module.exports = status
