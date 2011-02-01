function password() {
    this.info('Note: this will save your password in the global git config')
    this.require_password({}, function(pass) {
        this.config.set('pass', pass, true, function(err, data) {
            if (err) this.fatal('Failed to save password')
            this.ok('Saved password')
        }.bind(this))
    }.bind(this))
}

module.exports = password
