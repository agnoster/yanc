var stdin = process.stdin
  , tty = require('tty')


var prompt = {}
module.exports = prompt

prompt.once = function(out, cb) {
    process.stdout.write(out)
    stdin.setEncoding('utf8')
    stdin.resume()
    stdin.once('data', function(data) {
        stdin.pause()
        cb(data)
    })
}

prompt.password = function(out, cb) {
    process.stdout.write(out)
    stdin.setEncoding('utf8')
    tty.setRawMode()
    stdin.resume()

    var password = ""
    var reader = function (c) {
        c = c + ""
        switch (c) {
            case "\n": case "\r": case "\u0004":
                stdin.removeListener('data', reader)
                process.stdout.write("\n")
                stdin.pause()
                tty.setRawMode(false)
                cb(password)
                break
            case "\u0003":
                process.exit()
                break
            case '\b': case '\x7f': case '\x1b\x7f': case '\x1b\b':
                if (password.length) {
                    password = password.substr(0, password.length - 1)
                    process.stdout.write("\b \b")
                }
                break
            default:
                process.stdout.write("*")
                password += c
                break
        }
    }
    stdin.on("data", reader)
}


