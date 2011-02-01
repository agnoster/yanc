function list(user, base) {
    this.apiCall('Getting app list for "' + user + '" on ' + base, ['apps_list'], function(data) {
        if (data.length) {
            c = [20, 10, 10]
            console.log("Name".pad(c[0]) + "Port".pad(c[1]) + "Running".pad(c[2]))
            for (var i = 0; i < data.length; i ++) {
                console.log(data[i].name.pad(c[0]) + data[i].port.pad(c[1]) + data[i].running.pad(c[2]))
            }
        } else {
            this.info('No apps found')
        }
    })
}

module.exports = list
