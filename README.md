## Ares 2 Overview

Updated: 4/30/2012

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

For Ares to run, it simply expects the enyo and lib folders (including onyx, layout, and extra) from the 2.0b4 SDK or latest from Github to be present next to ares-project, as follows:

		* ares-project		git@github.com:enyojs/ares-project.git
		* enyo				git@github.com:enyojs/enyo.git
		* lib
			* onyx			git@github.com:enyojs/onyx.git
			* layout		git@github.com:enyojs/layout.git
			* extra			git@github.com:enyojs/extra.git

To run, simply open `ares-project/ares/index.html` from a web browser.

### Running the local file "server"
The local filesystem browser is in the ares-project repository, under hermes/filesystem. In order to run the service, you will need to have [Node.js](http://www.nodejs.org) installed (version 0.6 or later). To start the service, go to the hermes/filesystem directory, and run:
    node index.js
