/* global async, ares, ilibUtilities */

enyo.kind({
	name: "Ares.FileChooser",
	kind: "onyx.Popup",
	modal: true,
	centered: true,
	floating: true,
	autoDismiss: false,
	debug: false,
	published: {
		/**
		 * When true, allow to pick only a
		 * folder (the "Ok" button is active when a folder is
		 * selected).  Otherwise (the default), allow only to pick a file
		 * (the "Ok" button is active either when a file is
		 * selected or when a folder is selected and the file
		 * name input field is manually filled.).
		 */
		folderChooser: false,
		/**
		 * Popup header.  Defaults to "Select a File" or
		 * "Select a Folder" depending on the value of
		 * {Ares.FileChooser#folderChooser}.
		 */
		headerText: '',
		/**
		 * When true the {Ares.FileChooser} has a "New Folder"
		 * button
		 */
		allowCreateFolder: false,
		/**
		 * When true the {Ares.FileChooser} offers to define a
		 * new (not yet exiting) file name.  This property is
		 * applicable only if {Ares.FileChooser#folderChooser}
		 * is false.
		 */
		allowNewFile: false,
		/**
		 * When true the {Ares.FileChooser} show the toolbar.
		 */
		allowToolbar: true,
		/**
		 * When true the {Ares.FileChooser} allows the selection
		 * of the top-level in the file tree.
		 */
		serverSelectable: true
	},
	/**
	 * project configuration information
	 */
	project: null,
	components: [
		{kind: "FittableRows", classes: "onyx-popup ares-filechooser ares-classic-popup", components: [
			{classes:"title", components: [
				{name: "header", tag: "span", content: ilibUtilities("Select a directory")}
			]},
			{kind: "FittableColumns", classes: "onyx-light", fit: true, components: [
				{kind:"FittableRows", name: "sources", classes:"ares-left-pane-file-chooser", components:[
					{kind: "onyx.Toolbar", classes: "ares-small-toolbar title-gradient", components: [
						{content: ilibUtilities("Sources"), classes:"ares-create-sources"}
					]},
					{kind: "ProviderList", selector: ["type", "filesystem"], fit:"true", name: "providerList", onSelectProvider: "handleSelectProvider"}
				]},
				{kind: "HermesFileTree", fit: true, name: "hermesFileTree", onFileClick: "_selectFile", onFolderClick: "_selectFolder", onNewFolderConfirm: "createFolder"}
			]},
			{kind: "FittableRows", classes: "onyx-light ares-filechooser-footer", isContainer: true, components: [
				{classes:"ares-row ares-file-choser-row", name:"foldersPathRow", showing: true, components:[
					{tag:"label", name:"foldersPathLabel", classes: "ares-fixed-label ares-file-chooser-label"},
					{name: "foldersPathSelector", kind: "onyx.InputDecorator", classes: "onyx-toolbar-inline file-chooser-input", showing: true, components: [
						{name: "selectedFoldersPath", kind: "onyx.Input", classes: "only-light", disabled: true, placeholder: ilibUtilities("/Folders/File_Name")}
					]}
				]},
				{classes:"ares-row", name:"fileNameRow", showing: false, components:[
					{tag:"label", name:"fileNameLabel", classes: "ares-fixed-label ares-file-chooser-label", content: ilibUtilities("File name: ")},
					{name: "fileNameSelector", kind: "onyx.InputDecorator", classes: "onyx-toolbar-inline file-chooser-input", showing: false, components: [
						{name: "selectedFileName", kind: "onyx.Input", classes: "only-light", disabled: true, placeholder: ilibUtilities("File_Name"), selectOnFocus: true, oninput: "updateSelectedName", onchange: "updateSelectedName"}
					]}
				]}
			]},
			{kind: "onyx.Toolbar", classes:"bottom-toolbar", components: [
				{name: "cancel", kind: "onyx.Button", content: ilibUtilities("Cancel"), ontap: "cancel"},
				{name: "confirm", kind: "onyx.Button", content: ilibUtilities("OK"), classes:"right", ontap: "confirm", disabled: true}
			]}
		]},
		{name: "errorPopup", kind: "Ares.ErrorPopup", msg: ilibUtilities("Error message")}
	],
	events: {
		/**
		 * Emitted once the end-user clicks cancel or when a
		 * file/folder is chosen.
		 *
		 * If none is chosen (the end-user tapped "Cancel"),
		 * this event does not contain the {file} property.
		 *
		 * If a folder is chosen, the event contains the
		 * {file} property, itself having a true {isDir}
		 * property.
		 *
		 * If a file is chosen, one of the below is true:
		 *
		 * 1. {event#file} exists, {event#file#isDir} is false
		 * and {event#name} is falsy: the user selected the
		 * existing file {event#file}.
		 *
		 * 2. {event#file} exists, {event#file#isDir} is true
		 * and the {event#name} is set: The file {event#name}
		 * is to be created in the folder {event#file}
		 *
		 * 3. {event#file} exists, {event#file#isDir} is false
		 * and {event#name} is set: the file {event#name} is
		 * to be created in the same folder as the file
		 * {event#file}
		 */
		onFileChosen: ""
	},
	/** @private */
	create: function() {
		ares.setupTraceLogger(this);		// Setup this.trace() function according to this.debug value
		this.inherited(arguments);	

		this.folderChooserChanged();
		this.allowToolbarChanged();
		this.allowCreateFolderChanged();

		if (!this.headerText) {
			if (this.folderChooser) {
				this.setHeaderText(ilibUtilities("Select a Folder"));
			} else {
				this.setHeaderText(ilibUtilities("Select a File"));
			}
		} else {
			this.headerTextChanged();
		}	
	},

	/** @private */
	headerTextChanged: function () {
		this.$.header.setContent(this.headerText);
	},
	/** @private */
	folderChooserChanged: function () {
		if (this.folderChooser) {
			this.$.foldersPathLabel.setContent(ilibUtilities("Folder path: "));
		} else {
			this.allowNewFileChanged();
		}		
	},
	/** @private */
	allowCreateFolderChanged: function () {
		this.$.hermesFileTree.hideFileOpButtons();
		
		if (this.allowCreateFolder) {
			this.$.hermesFileTree.showNewFolderButton();
		}
	},
	/** @private */
	allowNewFileChanged: function () {
		if (!this.folderChooser) {
			if (this.allowNewFile) {
				this.$.foldersPathLabel.setContent(ilibUtilities("Folder path: "));
				this.$.fileNameRow.show();
				this.$.fileNameSelector.show();
				this.$.selectedFileName.setDisabled(false);
				return;
			}
		}

		this.$.foldersPathLabel.setContent(ilibUtilities("File path: "));
		this.$.fileNameRow.hide();
		this.$.fileNameSelector.hide();
		this.$.selectedFileName.setDisabled(true);
	},
	/** @private */
	allowToolbarChanged: function () {
		this.$.hermesFileTree.showToolbar(this.allowToolbar);
	},
	/** @private */
	handleSelectProvider: function(inSender, inEvent) {
		this.trace("sender:", inSender, ", event:", inEvent);
		var hft = this.$.hermesFileTree ;
		var next = inEvent.callBack ;
		if (inEvent.service) {
			async.series(
				[
					hft.connectService.bind(hft,inEvent.service),
					hft.refreshFileTree.bind(hft)
				],
				next
			);
		}
		return true; //Stop event propagation
	},
	/** @private */
	_selectFile: function(inSender, inEvent) {
		this.trace("sender:", inSender, ", event:", inEvent);
		
		if (this.folderChooser) {
			// TODO: should rather
			// selectedFile.parentId... but this node
			// property does not exist in Ares filesystems
			// (yet)
			this.selectedFile = undefined;
			this.$.confirm.setDisabled(true);
		} else {
			this.selectedFile = inEvent.file;
			this.selectedFile.parent = this.$.hermesFileTree.getParentOfSelected();
			
			this.$.confirm.setDisabled(this.selectedFile.isDir);	

			var path = inEvent.file.path;
			if (this.project) {
				// keep only the relative path
				var relativePath = path.substring(path.indexOf(this.project.id) + this.project.id.length, path.length);

				if (this.allowNewFile) {
					var folders = relativePath.slice(0, -inEvent.file.name.length - 1);
					if (folders === "") {folders =  "/";}
					this.$.selectedFoldersPath.setValue(folders);
					this.$.selectedFileName.setValue(inEvent.file.name);
				} else {
					if (!this.folderChooser) { this.$.selectedFoldersPath.setValue(relativePath); }
				}
			} else {
				this.$.selectedFoldersPath.setValue(path);
			}
		}

		this.updateConfirmButton();

		return true; // Stop event propagation
	},
	/** @private */
	_selectFolder: function(inSender, inEvent) {
		this.trace("sender:", inSender, ", event:", inEvent);
		
		this.selectedFile = inEvent.file;
		this.selectedFile.parent = this.$.hermesFileTree.getParentOfSelected();
		
		if (this.folderChooser) {
			this.$.confirm.setDisabled(false);
		} else {
			this.$.confirm.setDisabled(true);
		}
		
		var path = inEvent.file.path;
		if (this.project) {			
			// keep only the relative path
			var relativePath = path.substring(path.indexOf(this.project.id) + this.project.id.length, path.length);
			if (relativePath === "") {relativePath = "/";}
			if (inEvent.file.isDir) {this.$.selectedFoldersPath.setValue(relativePath); }
		} else {
			this.$.selectedFoldersPath.setValue(path);
		}
		
		this.updateConfirmButton();

		return true; // Stop event propagation
	},
	updateSelectedName: function(inSender, inEvent) {
		this.trace("sender:", inSender, ", event:", inEvent);
		this.updateConfirmButton();
		return true; // Stop event propagation
	},
	updateConfirmButton: function() {
		if (this.folderChooser) {
			this.$.confirm.setDisabled((this.selectedFile && this.selectedFile.isServer && !this.serverSelectable) || !(this.selectedFile && this.selectedFile.isDir));
		} else {
			if (!this.allowNewFile) {
				this.$.confirm.setDisabled(!(this.selectedFile && !this.selectedFile.isDir));
			} else {
				this.$.confirm.setDisabled(!(this.selectedFile && this.$.selectedFoldersPath.getValue() !== "" && this.$.selectedFileName.getValue() !== ""));
			}
		}
	},
	/** @private */
	confirm: function(inSender, inEvent) {
		this.trace("sender:", inSender, ", event:", inEvent);
		this.hide() ;
		
		var name = this.$.selectedFoldersPath.getValue();

		if (!this.checkedPath(name)) {
			this.doFileChosen();

			return true;
		}

		if (this.allowNewFile) {
			if (this.$.selectedFoldersPath.getValue() !== "/") {
				name = name + "/";
			}
			name = name + this.$.selectedFileName.getValue();
		}
		this.trace("New name:", name);

		this.doFileChosen({
			file: this.selectedFile,
			name: name
		});

		return true; // Stop event propagation
	},
	/** @private */
	cancel: function(inSender, inEvent) {
		this.trace("sender:", inSender, ", event:", inEvent);		
		this.hide() ;

		this.doFileChosen();
		
		return true; // Stop event propagation
	},
	/** @public */
	reset: function () {
		this.$.confirm.setDisabled(true);
		this.$.selectedFoldersPath.setValue("");
		this.$.selectedFileName.setValue("");
		this.$.hermesFileTree.disconnect();
		this.selectedFile = null;
		this.folderChooserChanged();
		this.allowToolbarChanged();
		this.allowCreateFolderChanged();
		
		this.disconnectProject();
	},
	/** @public */
	connectProject: function (project, next) {
		this.project = project;
		this.$.sources.hide();
		this.$.hermesFileTree.connectProject(this.project, next);
	},
	/** @public */
	disconnectProject: function () {
		this.project = null;
		this.$.sources.show();
		this.$.providerList.reset();
		this.$.hermesFileTree.disconnect();
	},
	/** @public */
	pointSelectedName: function(selectedPath, valid) {
		if (!valid) {
			selectedPath = "/";
		} 
		this.$.hermesFileTree.gotoNodePath(selectedPath);
	},
	/** @public */
	checkSelectedName: function(selectedPath) {
		this.$.hermesFileTree.checkNodePath(selectedPath);
	},
	/* @private */
	checkedPath: function(path) {
		var illegal = /[<>\\!?$%&*,:;"|]/i;

		if (path.match(illegal)) {
			this.showErrorPopup(ilibUtilities("Path '{path}' contains illegal characters", {path: path}));
			return false;
		}

		return true;
	},
	showErrorPopup : function(msg) {
		this.$.errorPopup.setErrorMsg(msg);
		this.$.errorPopup.show();
	}
});

