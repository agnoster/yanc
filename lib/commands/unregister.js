function unregister(user, base) {
    this.apiCall('Deleting user "' + user + '"', ['user_delete', user], function(data) {
        this.ok('User "' + user + '" deleted')
    })
}

module.exports = unregister

