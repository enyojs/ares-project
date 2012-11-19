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
	* Code completion using symbols from:
	  * the current project
	  * the Enyo version that comes with Ares
	  * the libraries included in the project
	* In the future, this will be used for advanced features context-sensitive documentation, etc.
* UI designer for drag and drop UI editing
	* Component definitions are round-tripped from the Editor to the Designer, meaning that changes made in one will immediately appear in the other.
* Integration with [PhoneGap online build](http://build.phonegap.com) (_Coming Soon_)
	
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

Optionally, configure the `root` of your local file-system access in `ide.json`. By default, the local filesystem service serves the files from your _Home_ or _My Documents_ directory, depending on your operating system. You might want to change this to point to the location of your project files, to make navigation faster & easier. 

For instance, you can change `@HOME@` to `@HOME@/Documents` or to `D:\\Users\\User` (if using backslashes [i.e. on Windows], use double slashes for JSON encoding)

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

You can also configure a permanent PhoneGap build account, also by editing `ide.json`.

Start the IDE server: (e.g. using the Command Prompt, navigate to the ares directory and type 'node ide.js')

On OSX:

	% node ide.js

Then wait for the following message in the console:

	[...]
	ARES IDE is now running at <http://127.0.0.1:9009/ide/ares/index.html> Press CTRL + C to shutdown
	[...]

Connect to the IDE using Google Chrome or Chromium (other browsers are not that well tested so far).  The default URL is [http://127.0.0.1:9009/ide/ares/index.html](http://127.0.0.1:9009/ide/ares/index.html)

On OSX:

	% open -a "Chromium" http://127.0.0.1:9009/ide/ares/index.html

**Debugging:** You can add `--debug` or `--debug-brk` to the node command-line in `ide.json` if you want to troubleshoot the service providers, _or_ directly on the main node command line to to troubleshoot the main IDE server.    Then start `node-inspector` as usual.
