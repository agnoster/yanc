function domain(action, domain, app) {
    var text = ''
    if (action == 'add') {
        text = 'Adding domain alias "' + domain + '" to app ' + app
    } else if (action == 'delete') {
        text = 'Removing domain alias "' + domain + '" to app ' + app
    } else {
        this.fatal('Did not understand action "' + action + '" - should be "add" or "delete"')
    }
    this.apiCall(text, ['appdomain_handler', app, domain, action], function(data) {
        this.ok(data.message)
    })
}

module.exports = domain

