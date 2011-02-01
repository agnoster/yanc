function coupon(email) {
    this.apiCall('Requesting coupon for ' + email, ['coupon_request', email], function(data) {
        this.ok('Coupon requested. You will receive an email when capacity allows.')
        this.config.save({ email: this.conf.email, base: this.conf.base }, true, function(err) {
            if (err) this.fatal('Could not save config: ' + err.message)
            this.ok('Saved email address and api server in the global config')
        }.bind(this))
    })
}

module.exports = coupon
