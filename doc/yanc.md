yanc(1) -- Yet Another Nodester CLI
===================================================

## SYNOPSIS

`yanc` <command> [args]

## DESCRIPTION

`yanc` is a command-line client that speaks to the [nodester API][], and strives to use sane
defaults for every configuration parameter. In an ideal case, you
should only have to specify config parameters if you are doing something
surprising, as long as you are using `git` and `npm` (including a
`package.json` for your app).

The CLI itself is subdivided into separate commands. Use `yanc help [command]`
for additional information on any one, or use `man yanc-command`.

* `help` [command]:
  Invoked on its own, displays this man page. You can also pass it a
  specific command, and it will display the usage information for that.

* `config` [<key> [<val>]]:
  View and set config variables. Any config variable (<email>, for instance)
  can be specified as a flag (--email=address@example.com), come from the config
  (git-based), or be guessed at. The guesses are usually good.

* `coupon` (conf: <email>):
  Request a coupon from nodester.

* `register` <coupon> (conf: <email>, <user>, <key>):
  Register a user using a given <coupon>.

* `create` [<app>] (conf: <user>, <pass>, <app>, <branch>):
  Create a new application named <app>.

* `push` [--no-start] (conf: <user>, <pass>, <app>, <branch>):
  Push current application from branch <branch>. Start by default.

* `start`|`stop` (conf: <user>, <pass>, <app>):
  Start or stop current application.

* `npm` <command> [args] (conf: <user>, <pass>, <app>):
  Install, update, or uninstall packages for the current app.


[nodester API]: http://nodester.com/api.html
