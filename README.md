## Ares 2 Overview

Updated: 2012-07-30

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
	* Ares currently connects to a Dropbox Hermes component for file storage on a user's Dropbox account, and to a "filesystem" component, to edit local files
	* We plan to add Hermes components for things like FTP and Box.net in the future
	* Key goals with this approach are to avoid forcing users to store files and/or credentials on Ares servers and allow freedom to choose the preferred storage location, whether cloud or local.
* Code editor
	* Ares integrates the Ace (Cloud9) code editor for code editing
* Code intelligence
	* Upon opening/editing a JavaScript file, Ares will parse the file and display a semantic outline of the code in the right-hand panel (for purposes of demonstrating parser)
	* In the future, this will be used for advanced features such as code-completion, context-sensitive documentation, etc.
* UI designer for drag and drop UI editing
	* The UI designer is hooked up to the editor in read-only mode currently. 
	
**Note:**  The current Dropbox interface was implemented with an authentication mechanism that has since been deprecated by Dropbox and for which API keys are no longer available, so most users will not be able to run their own Hermes Dropbox component at the moment.  However, those wishing to test drive the functionality above can open `ares/index.html` which points to a temporary hosted version of the Dropbox Hermes component using a valid API key.  We will be migrating the Dropbox authentication mechanism to the currently recommended scheme.  Note there is not yet a publicly hosted version of Ares.
	
### Future plans

The following features are in the works, and you should see them added as we move forward:

* Round-trip editing in the code editor and the designer
* Code completion and context-sensitive documentation
* Additional Hermes components to extend the local and cloud file storage options
* … and more!

### Setup

Install Node.js 0.6 or later, preferably from the [Official Download Page](http://nodejs.org/#download).

Get the source at the proper location: For Ares to run, it expects the enyo and lib folders (including onyx, layout, and extra) from the 2.0b5 SDK (or later) from Github to be present next to ares-project, as follows:

		* ares-project		git@github.com:enyojs/ares-project.git
		* enyo				git@github.com:enyojs/enyo.git
		* lib
			* onyx			git@github.com:enyojs/onyx.git
			* layout		git@github.com:enyojs/layout.git
			* extra			git@github.com:enyojs/extra.git

### Run

You have two options:

1. Use the IDE server (recommended)
1. Configure & start sub-servers manually & open `ares/index.html` as a local file from the browser.

#### Served IDE

Configure you local projects in `ide.json`. Current ide.json contains default working values. _Do not think you can modify the default values yet_.

	% vi ide.json
	{
		"backends":[
			{
				"id":"local",
				"name":"Local Filesystem",
				"command":"node", "params":["hermes/filesystem/index.js"]
			}
		],
		"workspace":{
			"projects":[
				{"id":"myProject", "backend_id":"local", "name":"My Project", "params":["9010", "hermes/filesystem/root"]}
			],
			"prefs":null
		}
	}

Start the IDE server:

	% node ide.js
	[…]
	ARES IDE is now running at <http://127.0.0.1:9009/ide/ares/index.html> Press CTRL + C to shutdown
	[…]
	Project [myProject]: connect to <https://127.0.0.1:9010> to accept SSL certificate
	[…]

Since Hermes runs as an SSL server with a self-signed certificate, you will need to approve the certificate when you initially connect to the server. Otherwise, Ares will not be able to communicate with the server, and you won't see your files.  We recommend that you *do not* check the box that says to "always trust" certificates signed by enyojs.com. Since the signing key is included in this distribution, anyone can make a certificate that matches this key.  Connect to the URL given in the logs above. _This step will vanish soon_

Connect to the IDE using Google Chrome or Chromium.  The default URL is [http://127.0.0.1:9009/ide/ares/index.html](http://127.0.0.1:9009/ide/ares/index.html)

	% open -a "Chromium" http://127.0.0.1:9009/ide/ares/index.html

#### Manual IDE

Start the file server:

	$ node ares-project/hermes/filesystem/index.js 9010 hermes/filesystem/root
	
Accept the SLL certificate at [https://127.0.0.1:9010](https://127.0.0.1:9010).  Then from another terminal, open the Ares IDE:

	$ open -a Chromium http://localhost:9010/ide/ares/index.html

**Debugging:** The following sequence (to be run in separated terminals) opens the ARES local file server in debug-mode using `node-inspector`.

	$ node --debug ares-project/hermes/filesystem/index.js 9010 hermes/filesystem/root
		
...then start `node-inspector` & the browser windows from a separated terminal:

	$ open -a Chromium http://localhost:9010/ide/ares/index.html
	$ node-inspector &
	$ open -a Chromium http://localhost:8080/debug?port=5858
