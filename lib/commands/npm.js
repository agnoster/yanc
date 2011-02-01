function npm(action, package, app) {
    if (/^dep/.exec(action)) {
        function _cb(err, json) {
            var p;
            if (err) this.fatal('Problem reading package.json: ' + err.message)
            if (!json || !json.hasOwnProperty('dependencies')) this.fatal('No dependencies declared in package.json')
            for (p in json.dependencies) {
                if (!json.dependencies.hasOwnProperty(p)) continue
                package = p + '@' + json.dependencies[p]
                return this.apiCall('[npm] Installing ' + package, ['appnpm_install', app, package], function(data) {
                    delete(json.dependencies[p])
                    _cb(null, json)
                })
            }
            return
        }
        _cb = _cb.bind(this)
        console.log('# Installing depencies from package.json')
        return this.config.pkg(_cb)
    }
    this.apiCall('[npm] ' + action + ' ' + package, ['appnpm_handler', app, package, action], function(data) {
        console.log(data.output.trim())
        this.ok('Call succeeded')
    })
}

module.exports = npm
