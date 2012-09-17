## Ares 2 Overview

Ares 2 is a browser-based code editor and UI designer for developing Enyo 2 applications.  Although Ares is still a work in progress, we have reached the point where we are opening the repo and will do further development in the open, so we encourage you to follow our progress and give us feedback as we push Ares forward.

### Basic architecture

The Ares project architecture is divided into several main pieces:

* **Ares** - The front-end designer/editor web application, with the following main components:
	* **Harmonia** - File system layer
	* **Phobos** - Document management
	* **Deimos** - Visual designer
* **Hermes Components** - Pluggable server-side components that provide interfaces to Ares clients for cloud-based services such as file storage and build services.  We're leveraging node.js, but Hermes components can use any server-side tech.

### Current status

Here are the main features you can start looking at today:

* De-centralized file storage
	* Ares currently connects to a "filesystem" component, to edit local files
	* We plan to add Hermes components for things Dropbox (implemented but not tested), FTP and Box.net in the future
	* Key goals with this approach are to avoid forcing users to store files and/or credentials on Ares servers and allow freedom to choose the preferred storage location, whether cloud or local.
* Code editor
	* Ares integrates the Ace (Cloud9) code editor for code editing
* Code intelligence
	* Upon opening/editing a JavaScript file, Ares will parse the file and display a semantic outline of the code in the right-hand panel (for purposes of demonstrating parser)
	* In the future, this will be used for advanced features such as code-completion, context-sensitive documentation, etc.
* UI designer for drag and drop UI editing
	* Component definitions are round-tripped from the Editor to the Designer, meaning that changes made in one will immediately appear in the other.
	
**Note:**  The current Dropbox interface was implemented with an authentication mechanism that has since been deprecated by Dropbox and for which API keys are no longer available, so most users will not be able to run their own Hermes Dropbox component at the moment.  However, those wishing to test drive the functionality above can open `ares/index.html` which points to a temporary hosted version of the Dropbox Hermes component using a valid API key.  We will be migrating the Dropbox authentication mechanism to the currently recommended scheme.  Note there is not yet a publicly hosted version of Ares.
	
### Future plans

The following features are in the works, and you should see them added as we move forward:

* Code completion and context-sensitive documentation
* Additional Hermes components to extend the local and cloud file storage options
* Improvements to the Designer component for greater ease of use
* ... and more!

### Setup

####Install Node.js 0.8 or later####
Preferably from the [Official Download Page](http://nodejs.org/#download).

####Install git (or a graphical git client)####
See the [Github.com help](https://help.github.com/articles/set-up-git) for hints

####Clone the ares-project repository from GitHub####
Using git, clone the repository using either the HTTPS or SSH urls:

	$ git clone https://github.com/enyojs/ares-project.git

or

	$ git clone git@github.com:enyojs/ares-project.git

Which URL you should clone from depends on how you have git set up (see github docs above).

####Update the submodule references####
Because Ares and Enyo are so closely linked, there are specific versions of Enyo and the libs folder included as references in the Ares repository. After cloning Ares, you need to update the submodules using "git submodule update"

	$ cd ares-project
	$ git submodule init
	$ git submodule update

If you are using a graphical Git client, there may or may not be a way to update the submodules from the GUI. If not, then use the commands above.

### Run

You have two options:

1. Use the IDE server (recommended)
1. Configure & start sub-servers manually & open `ares/index.html` as a local file from the browser.

#### Served IDE

Optionally, configure the `root` of your local file-system access in `ide.json`. By default, the local filesystem service serves the files from you "Home" or "My Documents" directory, depending on your operating system. You might want to change this to point to the location of your project files, to make navigation faster & easier. 

For instance, you can change "@HOME@" to "@HOME@/Documents" or to "D:\\Users\\User" (if using backslashes [i.e. on Windows], use double slashes for JSON encoding)

	% vi ide.json
	{
	"services":[
		{
			"active":true,
			"id":"home",
			"icon":"server",
			"name":"Local Files (home)",
			"type":"local",
			"command":"@NODE@", "params":[
				"hermes/filesystem/index.js", "0", "@HOME@"
			],
			"useJsonp":false,
			"debug": false
		},
	[...]

Start the IDE server: (e.g. using the Command Prompt, navigate to the ares directory and type 'node ide.js')

On OSX:

	% node ide.js

Then wait for the following message in the console:

	[...]
	ARES IDE is now running at <http://127.0.0.1:9009/ide/ares/index.html> Press CTRL + C to shutdown
	[...]

Connect to the IDE using Google Chrome or Chromium (other browserds are not that well tested so far).  The default URL is [http://127.0.0.1:9009/ide/ares/index.html](http://127.0.0.1:9009/ide/ares/index.html)

On OSX:

	% open -a "Chromium" http://127.0.0.1:9009/ide/ares/index.html

**Debugging:** You cann add `--debug` or `--debug-brk` to the node command-line in `ide.json` if you want to troubleshoot the service providers, _or_ directly on the main node command line to to troubleshoot the main IDE server.    Then start `node-inspector` as usual.

#### Manual IDE

Start the file server:

	$ node ares-project/hermes/filesystem/index.js 9010 hermes/filesystem/root
	
**Debugging:** The following sequence (to be run in separated terminals) opens the ARES local file server in debug-mode using `node-inspector`.

	$ node --debug ares-project/hermes/filesystem/index.js 9010 hermes/filesystem/root
		
...then start `node-inspector` & the browser windows from a separated terminal:

	$ open -a Chromium http://localhost:9010/ide/ares/index.html
	$ node-inspector &
	$ open -a Chromium http://localhost:8080/debug?port=5858

## Hermes Verbs

Hermes file-system providers use verbs that closely mimic the semantics defined by [WebDAV (RFC4918)](http://tools.ietf.org/html/rfc4918):  although Hermes reuses the same HTTP verbs (`GET`, `PUT`, `PROPFIND`, `MKCOL`, `DELETE` ...), it differs in terms of carried data.  Many (if not most) of the HTTP clients implement only the `GET` and `POST` HTTP verbs:  Hermes uses the same HTTP Method Overrides as WebDAV usually do (tunnel every requests but `GET` into `POST` requests that include a special `_method` query parameter)

* `PROPFIND` lists properties of a resource.  It recurses into the collections according to the `depth` parameter, which may be 0, 1, … etc plus `infinity`.  For example, the following directory structure:

		$ tree 1/
		1/
		├── 0
		└── 1

… corresponds to the following JSON object returned by `PROPFIND`.

		$ curl "http://127.0.0.1:9009/id/%2F?_method=PROPFIND&depth=10"
		{
		    "isDir": true, 
		    "path": "/", 
		    "name": "", 
		    "contents": [
		        {
		            "isDir": false, 
		            "path": "/0", 
		            "name": "0", 
		            "id": "%2F0"
		        }, 
		        {
		            "isDir": false, 
		            "path": "/1", 
		            "name": "1", 
		            "id": "%2F1"
		        }
		    ], 
		    "id": "%2F"
		}

* `MKCOL` create a collection (a folder) into the given collection, using the name `name` passed as a query parameter (and therefore URL-encoded).:

		$ curl -d "" "http://127.0.0.1:9009/id/%2F?_method=MKCOL&name=tata"

* `DELETE` delete a resource (a file), which might be a collection (a folder) 

		$ curl -d "" "http://127.0.0.1:9009/id/%2Ftata?_method=DELETE"


## Run Test Suite

So far, only hermes local filesystem access comes with a (small) test suite, that relies on [Mocha](http://visionmedia.github.com/mocha/) and [Should.js](https://github.com/visionmedia/should.js).  Run it using:

	$ hermes/node_modules/mocha/bin/mocha hermes/fsLocal.spec.js
	
## References

* [RFC4918 - HTTP Extensions for Web Distributed Authoring and Versioning (WebDAV)](http://tools.ietf.org/html/rfc4918)
* [RFC5689 - Extended MKCOL for Web Distributed Authoring and Versioning (WebDAV)](http://tools.ietf.org/html/rfc5689)
* Screencast [Debugging with `node-inspector`](http://howtonode.org/debugging-with-node-inspector)
