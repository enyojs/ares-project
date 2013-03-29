## Ares 2 Overview

Ares 2 is a browser-based code editor and UI designer for developing Enyo 2 applications.  Although Ares is still a work in progress, we have reached the point where we are opening the repo and will do further development in the open, so we encourage you to follow our progress and give us feedback as we push Ares forward.

You can give us feedback either via the [Ares category of the EnyoJS Forums](http://forums.enyojs.com/categories/ares) or via the [EnyoJS JIRA](https://enyojs.atlassian.net/) (using the `ares` component).

### Basic architecture

The Ares project architecture is divided into several main pieces:

* **Ares** - The front-end designer/editor web application, with the following main components:
	* **Harmonia** - File system layer, communicating with the server-side _Hermes_ components.
	* **Phobos** - Document management
	* **Deimos** - Visual designer
* **Hermes Components** - Pluggable server-side components that provide interfaces to Ares clients for cloud-based services such as file storage and build services.  We're leveraging node.js, but Hermes components can use any server-side tech.

### Current status

Here are the main features you can start looking at today:

* De-centralized file storage
	* Ares currently connects to a filesystem component, to edit local files (via the `fsLocal` Hermes service).  Ares can also be configured to use a per-user Dropbox account (via the `fsDropbox` Hermes service) as file storage.  See below for more details.
	* Key goals with this approach are to avoid forcing users to store files and/or credentials on Ares servers and allow freedom to choose the preferred storage location, whether cloud or local.
* Code editor
	* Ares integrates the Ace (Cloud9) code editor for code editing
* Code intelligence
	* Upon opening/editing a JavaScript file, Ares will parse the file and display a semantic outline of the code in the right-hand panel (for purposes of demonstrating parser)
	* Code completion using symbols from:
	  * the current project
	  * the Enyo version that comes with Ares
	  * the libraries included in the project
	* In the future, this will be used for advanced features context-sensitive documentation, etc.
* UI designer for drag and drop UI editing
	* Component definitions are round-tripped from the Editor to the Designer, meaning that changes made in one will immediately appear in the other.
* Integration with [PhoneGap online build](http://build.phonegap.com)
	
### Future plans

The following features are in the works, and you should see them added as we move forward:

* More code completion and context-sensitive documentation
* Additional Hermes components to extend the local and cloud file storage options: We plan to add Hermes components for FTP, Box.net and more
* Improvements to the Designer component for greater ease of use
* ... and more!

**Note:**  An up-to-date view of the ongoing activities is available from The [ARES JIRA](https://enyojs.atlassian.net/browse/ENYO/component/10302), itself available from the [EnyoJS JIRA](https://enyojs.atlassian.net/browse/ENYO).

### Install Ares

1. Install Node.js & NPM 0.8.x (>= 0.8.19).  Preferably from the [Official Download Page](http://nodejs.org/#download).
1. Run:

		$ npm -d install ares-ide

	The `-d` options gives some minimal troubleshooting information, which is pretty useful as `ares-ide` is a heavy package (more than 12 MB).

1. Once installed, run it using `node_modules/.bin/ares-ide` (or `node_modules\.bin\ares-ide.cmd`) on Windows.
1. Please report the issues you find in our JIRA at [https://enyojs.atlassian.net/](https://enyojs.atlassian.net/) against the component named `ares`.

### Develop Ares

1. Install Node.js & NPM 0.8.x (>= 0.8.19).  Preferably from the [Official Download Page](http://nodejs.org/#download).
1. Install git (or a graphical git client).  See the [Github.com help](https://help.github.com/articles/set-up-git) for hints
1. Pick a GitHub account

**Fresh workspace**, in case you do not yet have a development environment:

1. Clone the ares-project repository from GitHub.  Using git, clone the repository using either the HTTPS or SSH urls (depending on how you have setup Git):

		$ git clone --recursive git@github.com:enyojs/ares-project.git
		
   If you are using a graphical Git client, there may or may not be a way to update the submodules from the GUI. If not, then use the commands above.

1. Install NPM developpment dependencies
   
		$ npm -d install

1. Run Ares using `node ide.js` from the GitHub root folder

**Update workspace** if you already have a working environment (with a remote named `origin`), run the following sequence.

		$ git fetch origin
		$ git submodule foreach git fetch origin
		$ git merge origin/master
		$ git submodule update --init  --recursive
		$ npm -d install

**Note:** 

1. Until recently, `ares-project/node_modules` contained 3rd-party modules directly archived into `ares-project` own Git repository.  So existing repository owners _may_ need to run `rm -rf ares-project/node_modules` to properly update their trees.
2. Do **NOT** use Node.js 0.10.0: Ares does not work yet using this brand new version of Node.  [We are aware of the issue](https://enyojs.atlassian.net/browse/ENYO-2063).

### Use Ares to Develop Applications

Start the IDE server: (e.g. using the Command Prompt, navigate to the ares directory and type 'node ide.js')… 

	C:\Users\johndoe\node_modules\.bin> ares-ide.cmd

… or (Mac & Linux):

	$ node_modules/.bin/ares-ide

Get more information about the options using `-h` or `--help`:

	$ ares-ide --help

	Ares IDE, a front-end designer/editor web applications.
	Usage: "node ./ide.js" [OPTIONS]

	Options:
	  -h, --help     help message                                                              [boolean]
	  -T, --runtest  Run the non-regression test suite                                         [boolean]
	  -b, --browser  Open the default browser on the Ares URL                                  [boolean]
	  -p, --port     port (o) local IP port of the express server (default: 9009, 0: dynamic)  [default: "9009"]
	  -H, --host     host to bind the express server onto (default: 127.0.0.1)                 [default: "127.0.0.1"]

Optionally, configure the `root` of your local file-system access in `ide.json`. By default, the local filesystem service serves the files from your _Home_ or _My Documents_ directory, depending on your operating system. You might want to change this to point to the location of your project files, to make navigation faster & easier. 

For instance, you can change `@HOME@` to `@HOME@/Documents` or to `D:\\Users\\User` (if using backslashes [i.e. on Windows], use double slashes for JSON encoding)

	% vi ide.json
	[...]
	"command":"@NODE@", "params":[
		"hermes/fsLocal.js", "-P", "/files", "-p", "0", "@HOME@"
	],
	[...]

### Build

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

### Release & Publish

_This section is for Ares commiters only_

1. Tag the version you intend to publish, with the exact same string as the `version: ` in `package.json` & upload this tag.
1. Checkout a fresh copy _on a Linux (virtual) machine_ 
	* Publishing from a Windows machine will break UNIX (Linux & OSX) installations [NPM Issue 2097](https://github.com/isaacs/npm/issues/2097)
	* Packing from an OSX machine misses some files [NPM Issue 2619](https://github.com/isaacs/npm/issues/2619)
1. If not already done run `npm adduser` to allow your self to publish from this machine
1. Run `npm -d pack`
1. Publish the generated tarball `npm -d publish <ares-ide-x.y.z.tgz>`
	It is also possible to directly publish (skip the intemediate `pack`, but this one gives you a chance to verify the content of the publish archive without the need for a roundtrip with the NPM registry).
1. Check [ares-ide on the NPM registry](https://npmjs.org/package/ares-ide).

## Features

### PhoneGap Build

Ares includes the ability to package a mobile Enyo application using [PhoneGap Build](https://build.phonegap.com/).  You must have a properly setup account (with signing keys & distribution certificates) before being able to use Ares to build applications using PhoneGap Build.

Here are a few references to create the necessary signing keys & distribution certificates:

1. [Android Application Signing](http://developer.android.com/tools/publishing/app-signing.html)

### Dropbox

In order to use Dropbox as storage service for Ares, follow detailed setup instructions in `hermes/README.md`.  The Dropbox connector is not usable without following those instructions.


## Testing

For all contributions on Ares project and before commit, please execute the available Ares Test Suite. See [this page](test/README.md) for more details.

