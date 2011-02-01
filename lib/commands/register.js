function register(coupon, user, email, key, base) {
    if (!coupon) this.fatal('Must include a coupon code!')
    this.info('Registering user with the following information:')
    this.config.noprompt = true
    console.log('Username: ' + user)
    console.log('   Email: ' + email)
    console.log('  Coupon: ' + coupon)
    console.log(' SSH Key: ' + key)
    console.log('  Server: ' + base)
    this.info('If anything is incorrect, abort with Ctrl-C and use "nodester config"')
    this.require_password(this.conf, true, function(pass) {
        this.conf.pass = pass
        this.apiCall('Registering user "' + user + '"', ['user_create', user, pass, email, key, coupon], function(data) {
            this.ok('User created')
            this.config.save({ user: user, email: email, key: key, base: base }, true, function(err, data) {
                if (err) this.fatal(err.message)
                this.ok('Saved user information in global config')
            }.bind(this))
        })
    }.bind(this))
}

module.exports = register
