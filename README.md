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
* **Ares plugins** - Based on Hermes pluggable server-side components, Ares plugins can bring:  
  * New server-side services with their own configuration
  * The corresponding browser side code that will be loaded into the Ares IDE  
See [Ares plugins](#ares-plugins) for more details.
 


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
* Project templates
	* Allow creation of new projects based on bootplate templates.
	* Allow creation of new projects based on your own project templates.
	* See [Project templates](#project-templates) for more information
	
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
	  -h, --help        help message                                                                           [boolean]
	  -T, --runtest     Run the non-regression test suite                                                      [boolean]
	  -b, --browser     Open the default browser on the Ares URL                                               [boolean]
	  -p, --port        port (o) local IP port of the express server (default: 9009, 0: dynamic)               [default: "9009"]
	  -H, --host        host to bind the express server onto                                                   [default: "127.0.0.1"]
	  -a, --listen_all  When set, listen to all adresses. By default, listen to the address specified with -H  [boolean]
	  -c, --config      IDE configuration file                                                                 [default: "/Users/kowalskif/Desktop/GIT/enyojs/ares-project/ide.json"]
	  -l, --level       IDE debug level ('silly', 'verbose', 'info', 'http', 'warn', 'error')                  [default: "http"]
	  -L, --log         Log IDE debug to ./ide.log                                                             [boolean]

Optionally, configure the `root` of your local file-system access in `ide.json`. By default, the local filesystem service serves the files from your _Home_ or _My Documents_ directory, depending on your operating system. You might want to change this to point to the location of your project files, to make navigation faster & easier. 

For instance, you can change `@HOME@` to `@HOME@/Documents` or to `D:\\Users\\User` (if using backslashes [i.e. on Windows], use double slashes for JSON encoding)

	% vi ide.json
	[...]
	"command":"@NODE@", "params":[
		"hermes/fsLocal.js", "-P", "/files", "-p", "0", "@HOME@"
	],
	[...]

#### Reporting Issues

Be sure to run Ares with `--log` (or `-L`) to capture the Ares server output in the file name `ide.log`.  Attach this log-file to you bug report on the [ARES JIRA](https://enyojs.atlassian.net/browse/ENYO/component/10302).

You may also want to increase the log verbosity, in order to better understand what is going wrong by yourself.  The default verbosity level is `http`.  You may want o increase to `info` or even `verbose`.  Lowest layer `silly` is usually for Ares core developers.

	$ node ide.js --level=info

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
 
### [Project templates](id:project-templates)

The service "***genZip***" defined in "ide.json" of ares-project or "ide.json" of Ares plugins allows to intanciate new Ares project from project templates such as "**bootplate**" or any customer specific project templates.

The property "***projectTemplateRepositories***" of the service "**genZip**" lists the template definitions that are available at project creation time.

See the section "**Project template service**" in [hermes/README.md](hermes/README.md) for more information.

### [Ares plugins](id:ares-plugins)

Ares plugins can bring additional functionality and configuration to Ares.
An Ares plugin must follow these rules to be loaded as a plugin:

 * It must be installed in a directory under "_ares-project/node_modules_".  
 * It must have an "_ide.json_" in its main directory, which:
   * defines a new service entry
   * can define the client side code to load in the browser
   * can update some previously defined services (e.g.: modify/add project templates) 

#### Startup of "node ide.js"

At startup, the process "node ide.js":

 * loads the file "ide.json"
 * locates the files "node_modules/*/ide.json"
 * sorts then into the lexicographical order
 * merges them into the loaded configuration following the algorythm described in the next section.
 * starts the services defined in the resulting loaded configuration

#### [Merging Ares plugin configuration](id:merging-configuration)

Ares plugin configuration are merged as follow:

 * New service entries are simply added to the current configuration
 * Service entries already existing in the current configuration are merged property by property as follow:
 	* New properties are simply added to the existing service entry
 	* For array, array entries are added to the corresponding array in the existing service
 	* For objects, object properties are applied to the corresponding object in the existing service
 	* Other properties of same type are applied to overwrite the corresponding entries in the existing service
 	* Properties with same name but different types are considered as errors and stop the startup process.
 * Other top level properties are not yet taken into account

#### Client side Ares plugin

The client code of an Ares plugin is defined by the property "`pluginUrl`" of a service entry in "ide.json".  
During the initialization process of Ares within the browser, the 'ServiceRegistry' will perform an 'enyo.load' of the javascript file (Usually a 'package.js' file) specified by the property "`pluginUrl`".  
After being loaded, the new code must invoke `ServiceRegistry.instance.pluginReady();` to notify Ares that the client side code is ready.  
See the function 'pluginReady' in the file 'services/source/ServiceRegistry.js'.

## Testing

For all contributions on Ares project and before commit, please execute the available Ares Test Suite. See [this page](test/README.md) for more details.

