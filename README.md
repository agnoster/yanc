# nodester-client

> A client for the [nodester][] platform

## WARNING: THE README IS A LIE (for now)

In the spirit of [Readme-Driven Development][RDD], this document describes the intended 0.1.0 behavior.  The management bears no responsibility for divergent, or even deviant, behavior on the part of the software in the current pre-release state.

## What is this I don't even.

[nodester][] is an open-source platform for hosting [node][] apps, and I think that's the bee's knees. However, their [API][nodester API] - while delicious and moist - is a bit cumbersome to use with only curl. So, to fill this gap, nodester-client should give you a nice command-line tool to interface with it. If you've used the [heroku CLI][], you'll know what we're going for here.

Goals: assume only the tools you'd need anyway, namely [node][], [npm][], and [git][]. Whenever possible, nodester-client uses simple conventions to avoid tedious option-passing. See [Configuration](#Configuration) for more.

## Quick start

To get started quickly, install with [npm][]:

    $ npm install nodester-client

If you've already registered with nodester, deploying a new app is easy:

    $ cd ~/projects/pantscompetition/
    $ nodester create
    +OK app pantscompetition created, added remote nodester
    $ nodester push
    +OK pushed branch master to nodester
    $ nodester start
    +OK app pantscompetetion started

That should do it!

## Usage

### Check [nodester] status

    $ nodester status
    +OK Nodester is up
    Apps hosted: 73
    Apps running: 20

### Request a coupon

    $ nodester coupon
    +OK Coupon will be sent to my_email@from-git-config.com

### Register a user

    $ nodester register MYCOUPONCODE
    # registering user with following information:
    Username: fancypants
    Email: fancy@pants.org
    Key: ~/.ssh/id_rsa.pub =
    ssh-rsa Q2hhbmNlcyBhcmUgeW91ciBwYW50cyBhcmUgbm90IGFzIGZhbmN5IGFzIHRoZSBwYWlyIApPZiB2ZXJ5IGZhbmN5IHBhbnRzIHRoYXQgTXIuIEZhbmN5IFBhbnRzIHdpbGwgd2VhciAKV2hlbiBldmVyeWJvZHnigJlzIG1hcmNoaW5nIGluIHRoZSBmYW5jeSBwYW50cyBwYXJhZGUgCkhl4oCZcyBnb25uYSBwYXNzIHRoZSB0ZXN0IApIZeKAmXMgZ29ubmEgYmUgdGhlIGJlc3QgClRoZSBiZXN0IGluIHRlcm1zIG9mIHBhbnRzIAoKWW91IGxvb2sgaW4gZXZlcnkgY2F0YWxvZyB5b3Ugc2hvcCBhdCBldmVyeSBzdG9yZSAKQ2F1c2UgZXZlbiB0aG91Z2ggeW91IGhhdmUgYSBodW5kcmVkIHBhbnRzIHlvdSB3YW50IHNvbWUgbW9yZSAKV2hlbiBzdWRkZW5seSB5b3Ugc2VlIHRoZSBncmVhdGVzdCBwYW50cyB5b3XigJl2ZSBldmVyIHNlZW4gCkFuZCBldmVuIHRob3VnaCB5b3Uga25vdyAKSXTigJlzIGdvbm5hIGNvc3QgYSBsb3Qgb2YgZG91Z2ggCllvdSBoYXZlIHRvIGhhdmUgdGhlIHdvcmxk4oCZcyBiZXN0IHBhbnRzIAoKU2F5IGEgbGl0dGxlIHByYXllciBmb3IgTXIuIEZhbmN5IFBhbnRzIApUaGUgd2hvbGUgd29ybGQga25vd3MgClRoZXnigJlyZSBvbmx5IGNsb3RoZXMgCkFuZCBkZWVwIGluc2lkZSAKSGXigJlzIHNhZCAKClRoZXkgbWFrZSB0aGUgYmlnIGFubm91bmNlbWVudCBhbmQgdGhlIHRyb3BoeSBnb2VzIHRvIHlvdSAKWW91IHRob3VnaHQgeW91IGhhZCBzb21lIGZhbmN5IHBhbnRzIGFuZCBub3cgeW91IGtub3cgaXTigJlzIHRydWUgCllvdSBsb29rIGF0IE1yLiBGYW5jeSBQYW50cyBhbmQgaG9sZCB0aGUgdHJvcGh5IGhpZ2ggCkV2ZXJ5Ym9keSBjaGVlcnMgCldoaWxlIGhl4oCZcyBibGlua2luZyBiYWNrIHRoZSB0ZWFycyAKSGUgZG9lc27igJl0IGV2ZW4gaGF2ZSB0aGUgYmVzdCBwYW50cyAKClNheSBhIGxpdHRsZSBwcmF5ZXIgZm9yIE1yLiBGYW5jeSBQYW50cyAKSXTigJlzIGFsbCBoZSBoYWQgCkJ1dCBkb27igJl0IGZlZWwgYmFkIApIZeKAmWQgZG8gdGhlIHNhbWUgClRvIHlvdQo= fancy@pants
    # if any information is incorrect, press Ctrl-C to abort and use "nodester config"
    # please enter and confirm a password, or press Ctrl-C to abort
    Password:
    Confirm:
    # registering user...
    +OK user fancypants registered successfully

### Creating an app

    $ nodester create
    +OK created application pantscompetition
    # added remote nodester

### Pushing app

    $ nodester push
    # pushing to remote nodester from branch master
    +OK push received

### Starting/stopping app

    $ nodester start
    +OK app pantscompetition started
    $ nodester stop
    +OK app pantscompetition stopped

### Installing/upgrading packages

    $ nodester npm install express
    +OK installed package express@1.0.0 in app pantscompetition
    $ nodester npm uninstall express
    +OK uninstalled package express in app pantscompetition

Or, install all advertised dependencies from `package.json`

    $ nodester npm install
    # resolving dependencies from package.json...
    +OK installed package express@1.0.3 
    +OK installed package socket.io@0.6.8
    +OK installed package jquery@1.4.4
    +OK installed package request@1.0.0
    +OK installed package jsdom@0.1.20


## Configuration

### Keys

nodester-client has a small set of configuration keys, and it'll try to guess sensible defaults so you don't have to type them.

- **root**
  * Where `nodester-client` expects to talk to the API service
  * Defaults to http://nodester.com/
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

    $ nodester config
    user   fancypants                         # source: whoami
    email  fancy@pants.org                    # source: git config user.email
    key    /home/fancypants/.ssh/id_rsa.pub   # source: default
    app    pantscompetition                   # source: package.json
    start  app.js                             # source: package.json

Setting a config variable works, too:

    $ nodester config app "pantscompetition"
    # in a .git project, setting local configuration
    app    pantscompetition                   # source: git config nodester.app
    $ nodester config pass --prompt --global
    Password:
    Confirm:
    # set global configuration
    pass   **************                     # source: git config nodester.pass
    $ nodester config user "fancy" --global
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
