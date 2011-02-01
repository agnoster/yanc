function npm(action, package, app) {
    this.apiCall('[npm] ' + action + ' ' + package, ['appnpm_handler', app, package, action], function(data) {
        console.log(data.output.trim())
        this.ok('Call succeeded')
    })
}

module.exports = npm
