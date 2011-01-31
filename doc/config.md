nodester-config(1) -- nodester CLI configuration
================================================

## SYNOPSIS

`nodester` config [<key> [<value>]]

## DESCRIPTION

nodester has a powerful configuration system that's probably best
left alone. However, if you cannot be dissuaded from tinkering, here's
what you should know:

* Command-line flags rule:
  Any key can be overridden on the commandline. For example, the email
  for a coupon request can be set on the commandline like so:

    nodester coupon --email=address@example.com

* Environment variables:
  The second place configuration variables can be set is in the environment.
  For instance, `export NODESTER_ROOT=http://api2.nodester.com/` would set
  the value for <root> to 'http://api2.nodester.com/' within the current shell.

* Git config:
  nodester-client stores any configuration keys in the "nodester" section of
  the git config. This means the same configuration rules as for git apply: local
  trumps global, which trumps system. If you use `nodester config` to set a
  config key, it will either set it with `git config --local` (if you specify
  `--local` or are in a git project), or it will set it with `git config --global`
  (if you specify `--global` or are not in a git project).

* Defaults:
  Out of the box, nodester tries to pick smart defaults. In some cases, this default
  will be frozen to the config. For instance, when a coupon is requested we save the
  email it was requested for, so that a subsequent `nodester register` will use the
  correct email, even if git has a different email configured in the meantime.

## KEYS

* <root>:
  Where `nodester-client` expects to talk to the API service  
  default: http://nodester.com/
* <email>:
  Receive a coupon or register your user to this address  
  default: your email from git, as reported by `git config user.email`
* <user>:
  Your username on the nodester system  
  default: your system user name, as reported by `whoami`
* <key>:
  Path to an SSH identity file  
  default: `~/.ssh/id_rsa.pub` or `~/.ssh/id_dsa.pub`, if available, in that order
* <app>:
  Name of the application on nodester  
  default: the current directory name
* <start>:
  Name of the script to run on nodester  
  default: "main" as described in `package.json`, falls back to `server.js` or `app.js` if available, and in that order
* <pass>:
  Password to authenticate with nodester  
  default: ... nothing. Prompt the user every time by default.
* <remote>:
  Name of git remote to connect to nodester  
  default: "nodester"
* <branch>:
  Name of branch to push to nodester  
  default: "master"
