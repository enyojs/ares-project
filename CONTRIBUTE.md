Contribute to Ares
==================

The master version of this page is located [here](https://github.com/enyojs/ares-project/blob/master/CONTRIBUTE.md).

Basic architecture
------------------

The Ares project architecture is divided into several main pieces:

* **Ares** - The front-end designer/editor web application, with the following main components:
	* **Harmonia** - File system layer, communicating with the server-side _Hermes_ components.
	* **Phobos** - Document management
	* **Deimos** - Visual designer
* **Hermes Components** - Pluggable server-side components that provide interfaces to Ares clients for cloud-based services such as file storage and build services.  We're leveraging node.js, but Hermes components can use any server-side tech.
* **Ares plugins** - Based on Hermes pluggable server-side components, Ares plugins can bring:  
  * New server-side services with their own configuration
  * The corresponding browser side code that will be loaded into the Ares IDE  
See [Ares plugins](README.md#ares-plugins) for more details.
 

Real stuff - Code
-----------------

### Setup a developement environment

1. Install Node.js & NPM 0.8.x (>= 0.8.19).  Preferably from the [Official Download Page](http://nodejs.org/#download).
1. Install git (or a graphical git client).  See the [Github.com help](https://help.github.com/articles/set-up-git) for hints
1. Pick a GitHub account

**Fresh workspace**, in case you do not yet have a development environment:

1. Clone the ares-project repository from GitHub.  Using git, clone the repository using either the HTTPS or SSH urls (depending on how you have setup Git):

		$ git clone --recursive git@github.com:enyojs/ares-project.git		
		
   If you are using a graphical Git client, there may or may not be a way to update the submodules from the GUI. If not, then use the commands above.

1. Install NPM developpment dependencies
   
		$ cd ares-project
		$ npm -d install

1. Run Ares using `node ide.js` from the GitHub root folder

**Update workspace** if you already have a working environment (with a remote named `origin`), run the following sequence.

		$ git fetch origin
		$ git submodule foreach git fetch origin
		$ git merge origin/master
		$ git submodule update --init  --recursive
		$ npm -d install						# Be sure to run "git submodule update ..." before "npm install"	

**Note:** 

1. Until recently, `ares-project/node_modules` contained 3rd-party modules directly archived into `ares-project` own Git repository.  So existing repository owners _may_ need to run `rm -rf ares-project/node_modules` to properly update their trees.
2. Do **NOT** use Node.js 0.10.0: Ares does not work yet using this brand new version of Node.  [We are aware of the issue](https://enyojs.atlassian.net/browse/ENYO-2063).

#### Some Git+NPM Automation Examples

The [contrib directory](contrib/githooks) contains git hooks that you can install:

* [npm-install](contrib/githooks/post-checkout/npm-install) to be copied as `.git/hooks/post-checkout`. This hook will run `npm -d install` after each `git checkout`. This hook requires bash shell.
* [prepend-branch-name](contrib/githooks/prepare-commit-msg/prepend-branch-name) to be copied as `.git/hooks/prepare-commit-msg`. This hook will prepend the branch name (i.e. `ENYO-1234:`) in front of commit messages. This hook requires Perl.

### Coding

Ares 2 is part of the EnyoJS ecosystem.  Before contributing code to Ares or Enyo, you want to read the [Contributors Guide](http://enyojs.com/community/contribute/).  Source-code contributions to the core Ares code are expected to follow the [Enyo Style Guide](https://github.com/enyojs/enyo/wiki/Style-Guide).

#### Jshint

Ares 2 will be soon integrated with [Travis CI](https://travis-ci.org/) to automatically run [JSHint](http://www.jshint.com/) when pull-requests are submitted.

Before submitting a pull request, please follow these steps

	$ cd ares-project
	$ npm test
	
NOTE: JSHint configuration files (.jshintrc, …) are automatically loaded by some editors when the appropriate plugins are installed. See [JSHint - Plugins for text editors and IDEs](http://www.jshint.com/install/)

#### Tracing

Following the setup of jshint we had a lot of warning because of missing curly braces as most of the traces were in the form of:

	if (this.debug) this.log(...);

Instead of adding curly braces and going from one line to three lines for each trace, we decided to add a `this.trace()` function which references this.log() or a "NOP" function depending on `this.debug` boolean value.

`To setup this.trace() function`, add the following in the create method of the kind.

	create: function() {
		ares.setupTraceLogger(this);		// Setup this.trace() function according to this.debug value
		this.inherited(arguments);
		
		this.trace("Just created a new", this.name, "object", this);
	}
	
You can then directly call this.trace() in the same way this.log is used.

WARNING: Removing the "`if (this.debug)`" test can add CPU overhead in particular when concataining strings or invoking functions in the "`this.trace()`" call.

So, it's recommended to pass each string element as a parameter instead of concataining them with "+" operator.

`this.debug` is still available and can be used if needed.

NOTE: For production, we may suppress the "this.trace()" code when doing the minification process.

### Ares styling

Ares 2 uses the dynamic stylesheet language LESS.

For the moment, all css compilation is done on the client side and is loaded through index.html.

We are waiting for ares minification to make possible using Ares.less on the client side in debug.html and compiled Ares.css file in index.html.

### Adding css/less styling

We have two main .less files :
	
	- ares-variables.less
	- ares-rules.less

In ares-variables.less, onyx variables are overridden and specific ares variables are added.

In ares-rules.less onyx css classes and specific ares css classes use variables declared in ares-variables.less.

To add new style to Ares, the file ares-rules.less should contain the new css classe. Check if one of variables can be used from ares-variables.less. Otherwise, add a new one.

For more information see [this page](https://github.com/enyojs/enyo/wiki/UI-Theming).

### Testing

For all contributions on Ares project and before commit, please execute the available Ares Test Suite. See [this page](test/README.md) for more details.



Build an Ares package
---------------------

In order to produce Ares on a build server:

1. Make sure Node and NPM are installed on the build server.  Version 0.8.x is known to work
1. In the build script, run:

		$ npm pack

	This produces a package like the below:
  
		$ tar tzvf ares-0.0.2.tgz | less
		
		-rw-r--r--  0 506    20       1496 Mar  6 13:48 package/package.json
		-rw-r--r--  0 506    20       6004 Mar  6 14:11 package/README.md
		-rwxr-xr-x  0 506    20      10397 Mar  6 14:12 package/ide.js
		-rw-r--r--  0 506    20         74 Jun 18  2012 package/deimos/package.js
		[…]

	You can then un-gzip & un-tar before repacking with a different folder name than `package/` & re-pack with your prefered packaging tool.
1. You may optionally test that the NPM-generated package works.  The following sequence is supposed to successfully install Ares from the generated package & start Ares.

		$ mkdir ../test && cd ../test
		$ npm install ../ares-project/ares-ide-0.0.2.tgz
		$ node_modules/.bin/ares-ide

Release & Publish Ares
----------------------

_This section is for Ares commiters only_

Before publishing a few steps and checkings are mandatory:

1. Commit your changes
2. In package.json, update the `dependencies` and `bundledDependencies` if your changes introduce/change node module dependencies.
3. Execute `npm-shrinkwrap` to update the file `npm-shrinkwrap.json`.
4. Execute `npm pack`
5. In a temporary directory, execute `npm install <path-to>/ares-ide-<version>.tgz` to verfy that the generated .tgz file if correct.
6. Perform a few tests to verify that everything works.
7. Commit your changes and start the publish process described above.

To publish:

1. Tag the version you intend to publish, with the exact same string as the `version: ` in `package.json` & upload this tag.
1. Checkout a fresh copy _on a Linux (virtual) machine_ 
	* Publishing from a Windows machine will break UNIX (Linux & OSX) installations [NPM Issue 2097](https://github.com/isaacs/npm/issues/2097)
	* Packing from an OSX machine misses some files [NPM Issue 2619](https://github.com/isaacs/npm/issues/2619)
1. If not already done run `npm adduser` to allow your self to publish from this machine
1. Run `npm -d pack`
1. Publish the generated tarball `npm -d publish <ares-ide-x.y.z.tgz>`
	It is also possible to directly publish (skip the intermediate `pack`, but this one gives you a chance to verify the content of the publish archive without the need for a roundtrip with the NPM registry).
1. Check [ares-ide on the NPM registry](https://npmjs.org/package/ares-ide).


