# yanc

> Yet Another [Nodester][nodester] Client

## WARNING: THE README IS A LIE (for now)

In the spirit of [Readme-Driven Development][RDD], this document describes the intended 0.1.0 behavior.  The management bears no responsibility for divergent, or even deviant, behavior on the part of the software in the current pre-release state.

## What is this I don't even.

[nodester][] is an open-source platform for hosting [node][] apps, and I think that's the bee's knees. However, their [API][nodester API] - while delicious and moist - is a bit cumbersome to use with only curl. So, to fill this gap, yanc should give you a nice command-line tool to interface with it. If you've used the [heroku CLI][], you'll know what we're going for here.

Goals: assume only the tools you'd need anyway, namely [node][], [npm][], and [git][]. Whenever possible, yanc uses simple conventions to avoid tedious option-passing. See [Configuration](#Configuration) for more.

## Quick start

To get started quickly, install with [npm][]:

    $ npm install yanc

If you've already registered with nodester, deploying a new app is easy:

    $ cd ~/projects/pantscompetition/
    $ yanc create
    OK: app pantscompetition created, added remote nodester
    $ yanc push
    OK: pushed branch master to nodester
    $ yanc start
    OK: app pantscompetetion started

That should do it!

## Usage

### Check [nodester] status

    $ yanc status
    # Checking status on api.nodester.com... done
    OK: The system is up!
    Apps hosted:      152
    Apps running:      74

### Request a coupon

    $ yanc coupon
    # Requesting coupon for email-from@my-git-config.com... done
    OK: Coupon requested. You will receive an email when capacity allows.
    OK: Saved email address and api server in the global config

### Register a user

    $ yanc register MYCOUPONCODE
    INFO: Registering user with the following information:
    Username: fancypants
       Email: fancy@pants.com
      Coupon: MYCOUPONCODE
     SSH Key: /Users/fancypants/.ssh/id_rsa.pub
      Server: api.nodester.com
    INFO: If anything is incorrect, abort with Ctrl-C and use "nodester config"
    Password: ********
    Confirm password: ********
    # Registering user "fancypants"... done
    OK: User created
    OK: Saved user information in global config

### Creating an app

    $ yanc create
    # Creating application "pantscompetetion"... done
    OK: Application created successfully
    Name:     pantscompetetion
    Running:  false
    Port:     8375
    Git repo: ec2-user@nodester.com:/home/ec2-user/hosted_apps/fancypants/222-c4d515bd6f0df4ac625d33daab98f4e6.git
    Start:    server.js
    PID:      unknown
    OK: Added git remote: yanc
    OK: Saved app name, remote, and branch settings

### Pushing app

    $ yanc push
    # Pushing branch "master" to remote "yanc"... 

    Counting objects: 103, done.
    Delta compression using up to 2 threads.
    Compressing objects: 100% (102/102), done.
    Writing objects: 100% (103/103), 39.22 KiB, done.
    Total 103 (delta 44), reused 0 (delta 0)
    remote: From /home/ec2-user/hosted_apps/fancypants/222-c4d515bd6f0df4ac625d33daab98f4e6.git/.
    remote:  * [new branch]      master     -> origin/master
    remote: cat: .app.pid: No such file or directory
    remote: kill: usage: kill [-s sigspec | -n signum | -sigspec] pid | jobspec ... or kill -l [sigspec]
    To ec2-user@nodester.com:/home/ec2-user/hosted_apps/fancypants/222-c4d515bd6f0df4ac625d33daab98f4e6.git
    * [new branch]      master -> master
    OK: Push successful

### Starting/stopping app

    $ yanc start
    # Starting app "pantscompetition"... done
    OK: App domainzomg started
    $ yanc stop
    # Stopping app "pantscompetition"... done
    OK: App domainzomg stopped

### Installing/upgrading packages

    $ yanc npm install express
    OK: installed package express@1.0.0 in app pantscompetition
    $ yanc npm uninstall express
    OK: uninstalled package express in app pantscompetition

Or, install all advertised dependencies from `package.json`

    $ yanc npm deps
    # resolving dependencies from package.json...
    OK: installed package express@1.0.3 
    OK: installed package socket.io@0.6.8
    OK: installed package jquery@1.4.4
    OK: installed package request@1.0.0
    OK: installed package jsdom@0.1.20


## Configuration

### Keys

yanc has a small set of configuration keys, and it'll try to guess sensible defaults so you don't have to type them.

- **base**
  * Server where `yanc` expects to talk to the API service
  * Defaults to `api.nodester.com`
- **email**
  * The email you want to receive a coupon to or register your user with
  * Defaults to your email from git, as reported by `git config user.email`
- **user**
  * Your username on the nodester system
  * Defaults to your system user name, as reported by `whoami`
- **key**
  * Path to an SSH identity file
  * Defaults to `~/.ssh/id_rsa.pub` or `~/.ssh/id_dsa.pub`, if available, in that order
- **app**
  * Name of the application on nodester
  * Defaults to the current directory name
- **start**
  * Name of the script to run [forever][]
  * Defaults to "main" as described in `package.json`, falls back to `server.js` or `app.js` if available, and in that order
- **pass**
  * Password to authenticate with nodester
  * Defaults to ... nothing. Prompt the user every time by default.
- **remote**
  * Name of git remote to connect to nodester
  * Defaults to "nodester"
- **branch**
  * Name of branch to push to nodester
  * Defaults to "master"

### Setting and Getting

You can specify a value for any key by passing `--configkey="value"` on the command line.

You can also use `nodester config`:

    $ yanc config
    user   fancypants                         # source: whoami
    email  fancy@pants.org                    # source: git config user.email
    key    /home/fancypants/.ssh/id_rsa.pub   # source: default
    app    pantscompetition                   # source: package.json
    start  app.js                             # source: package.json

Setting a config variable works, too:

    $ yanc config app "pantscompetition"
    # in a .git project, setting local configuration
    app    pantscompetition                   # source: git config nodester.app
    $ yanc config pass --prompt --global
    Password:
    Confirm:
    # set global configuration
    pass   **************                     # source: git config nodester.pass
    $ yanc config user "fancy" --global
    # set global configuration
    user   fancy                              # source: git config nodester.app

### Fallback logic

The fallback logic is:

1. First, if a value is specified on the command-line via `--configkey="value"`, use that.
2. Next, check the value via `git config` for `nodester.$VAR`.
3. Third, check for a sensible default.
4. If we couldn't use a sensible default, prompt the user.

In practice, this gives you an enormous amount of flexibility. Enough flexibility to shoot yourself in the foot, and nobody likes gangrene, so I recommend Keeping It Simple, Señor!

[nodester]: http://www.nodester.com/
[RDD]: http://tom.preston-werner.com/2010/08/23/readme-driven-development.html
[nodester API]: http://www.nodester.com/api.html
[heroku CLI]: http://docs.heroku.com/heroku-command
[node]: http://nodejs.org/
[npm]: http://npmjs.org/
[git]: http://git-scm.com/
[forever]: https://github.com/indexzero/forever
