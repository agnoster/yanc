function printvar(key, val, source) {
    console.log(key.pad(8) + ' ' + val.pad(50) + ' # ' + source)
}

function config(key, val) {
    this.config.noprompt = true

    if (key) {
        if (match = /(\w+)=([\"\']?)(.*)\2$/.exec(key)) {
            key = match[1]
            val = match[3]
        }
        if (val) {
            this.config.set(key, val, this.options.global, function(err) {
                if (err) this.fatal("Error: " + err.message)
                this.ok("Set " + key + "=\"" + val + "\"")
            }.bind(this))
        } else { // only key specified
            if (this.options.unset) {
                this.config.unset(key, this.options.global, function(err) {
                    if (err && err.code == 5) this.fatal("Key doesn't exist")
                    if (err) this.fatal("Could not delete conf key: " + err.message)
                    this.ok("Deleted conf key: " + key)
                }.bind(this))
            } else {
                this.config.get(key, function(err, key, value, source) {
                    if (err) return this.fatal(err.message)
                    if (key == 'pass') value = value.replace(/./g, '*')
                    printvar(key, value, source)
                }.bind(this))
            }
        }
    } else {
        this.config.list(function(err, key, value, source) {
            if (this.options.freeze) {
                this.config.set(key, value, false, function(err, data) {
                    if (!err) cli.ok('set ' + key + '="' + value + '"')
                    else cli.error('failed setting ' + key)
                }.bind(this))
            } else {
                if (key == 'pass') value = value.replace(/./g, '*')
                printvar(key, value, source)
            }
        }.bind(this))
    }
}

module.exports = config
