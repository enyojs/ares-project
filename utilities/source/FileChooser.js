/* global async, ares */

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
		 * When true (the default), allow to pick only a
		 * folder (the "Ok" button is active when a folder is
		 * selected).  Otherwise, allow only to pick a file
		 * (the "Ok" button is active either when a file is
		 * selected or when a folder is selected and the file
		 * name input field is manually filled.).
		 */
		folderChooser: true,
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
		allowCreateFolder: true,
		/**
		 * When true the {Ares.FileChooser} offers to define a
		 * new (not yet exiting) file name.  This property is
		 * applicable only if {Ares.FileChooser#folderChooser}
		 * is false.
		 */
		allowNewFile: true,
		/**
		 * File name to use for the selection.  Has visible
		 * effects only when {Ares.FileChooser#folderChooser}
		 * is true.
		 */
		selectedName: "",
		/**
		 * project configuration information
		 */
		project: null
	},
	components: [
		{kind: "FittableRows", classes: "onyx-popup ares-filechooser ares-classic-popup", components: [
			{tag: "div", name: "header", classes:"title", content: $L("Select a directory")},
			{kind: "FittableColumns", classes: "onyx-light", fit: true, components: [
				{kind:"FittableRows", name: "sources", classes:"ares-left-pane-file-chooser", components:[
					{kind: "onyx.Toolbar", classes: "ares-top-toolbar", components: [
						{content: $L("Sources"), classes:"ares-create-sources"}
					]},
					{kind: "ProviderList", selector: ["type", "filesystem"], name: "providerList", classes:"ares-provider-list",/*style:"border: 3px solid yellow;", header: "Sources",*/ onSelectProvider: "handleSelectProvider"}
				]},
				{kind: "HermesFileTree", fit: true, name: "hermesFileTree", onFileClick: "_selectFile", onFolderClick: "_selectFolder", onNewFolderConfirm: "createFolder"}
			]},
			{kind: "FittableRows", classes: "onyx-light ares-filechooser-footer", isContainer: true, components: [
				//TO DO : make possible to scroll on the selected folder in the file tree
				/*{name: "folderSelector", kind: "onyx.InputDecorator", classes: "onyx-toolbar-inline", components: [
					{content: $L("Where") + ":", fit: true},
					{name: "selectedFolder", kind: "onyx.Input", classes: "only-light file-chooser-input", disabled: true, placeholder: $L("Folder")}
				]},*/
				{classes:"ares-row ares-file-choser-row", name:"fileNameRow", showing: false, components:[
					{tag:"label", classes: "ares-fixed-label ares-file-chooser-label", content: $L("File name: ")},
					{name: "nameSelector", kind: "onyx.InputDecorator", classes: "onyx-toolbar-inline file-chooser-input", showing: false, components: [
						{name: "selectedName", kind: "onyx.Input", classes: "only-light", disabled: true, placeholder: $L("File"), selectOnFocus: true, onchange: "updateSelectedName"}
					]}
				]}
			]},
			{kind: "onyx.Toolbar", classes:"bottom-toolbar", components: [
				{name: "cancel", kind: "onyx.Button", content: $L("Cancel"), ontap: "cancel"},
				{name: "confirm", kind: "onyx.Button", content: $L("OK"), classes:"right", ontap: "confirm"}
			]}
		]}
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
		if (!this.headerText) {
			if (this.folderChooser) {
				this.setHeaderText($L("Select a Folder"));
			} else {
				this.setHeaderText($L("Select a File"));
			}
		}
		if (!this.folderChooser) {
			this.$.fileNameRow.show();
			this.$.nameSelector.show();
			if (this.allowNewFile) {
				this.$.selectedName.setDisabled(false);
			}
		}
		this.$.header.setContent(this.headerText);
		this.$.hermesFileTree.hideFileOpButtons();
	},
	/** @private */
	headerTextChanged: function () {
		this.$.header.setContent(this.headerText);
	},
	/** @private */
	selectedNameChanged: function(oldSelectedName) {
		this.trace("old:", oldSelectedName, " -> new:", this.selectedName);
		this.$.selectedName.setValue(this.selectedName);
		this.updateConfirmButton();
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
		} else {
			this.selectedFile = inEvent.file;
			this.selectedFile.parent = this.$.hermesFileTree.getParentOfSelected();
			this.$.confirm.setDisabled(false);
		}

		// keep omly the relative path
		var hft = this.$.hermesFileTree;
		var relativePath=inEvent.file.path.slice(-(inEvent.file.path.length - hft.$.serverNode.file.path.length));
		this.setSelectedName(relativePath);

		return true; // Stop event propagation
	},
	/** @private */
	_selectFolder: function(inSender, inEvent) {
		this.trace("sender:", inSender, ", event:", inEvent);
		// do neither modify this.selectedName nor
		// this.$.selectedName.value
		this.selectedFile = inEvent.file;
		this.selectedFile.parent = this.$.hermesFileTree.getParentOfSelected();
		if (this.folderChooser) {
			this.$.confirm.setDisabled(false);
		} else {
			this.$.confirm.setDisabled(true);
		}
		//this.$.selectedFolder.setValue(inEvent.file.name);
		this.updateConfirmButton();
		return true; // Stop event propagation
	},
	updateSelectedName: function(inSender, inEvent) {
		this.trace("sender:", inSender, ", event:", inEvent);
		this.$.confirm.setDisabled(false);
		this.setSelectedName(inSender.getValue());
	},
	updateConfirmButton: function() {
		if (this.folderChooser) {
			this.$.confirm.setDisabled(!(this.selectedFile && this.selectedFile.isDir));
		} else {
			this.$.confirm.setDisabled(!(this.selectedFile && this.selectedName));
		}
	},
	/** @private */
	confirm: function(inSender, inEvent) {
		this.trace("sender:", inSender, ", event:", inEvent);
		this.hide() ;
		this.trace("selectedFile:", this.selectedFile, "selectedName:", this.selectedName);
		this.doFileChosen({
			file: this.selectedFile,
			name: (this.selectedName === this.selectedFile.name ? undefined : this.selectedName)
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
	//FIXME: This is *nearly* identical to the code in Harmonia. Maybe move this into HermesFileTree?
	createFolder: function(inSender, inEvent) {
		this.trace("sender:", inSender, ", event:", inEvent);
		var folderId = inEvent.folderId;
		var name = inEvent.fileName.trim();
		var service = this.selectedFile.service;
		this.trace("Creating new folder:", name, "into folderId:", folderId, "under service:", service);
		service.createFolder(folderId, name)
			.response(this, function(inSender, inResponse) {
				this.trace("Response: ", inResponse);
				this.$.hermesFileTree.refreshFileTree(null, inResponse);
			})
			.error(this, function(inSender, inError) {
				this.warn("Error: ", inError);
				this.$.hermesFileTree.showErrorPopup(this.$LS("Creating folder '{folder}' failed: {error}", {folder: name, error: inError.toString()}));
			});
	},
	/** @public */
	reset: function () {
		this.$.sources.show();
	},
	/** @public */
	connectProject: function (project, next) {
		this.project = project;
		this.$.sources.hide();
		this.$.hermesFileTree.connectProject(this.project, next);
	},
	/** @public */
	pointSelectedName: function(selectedName, valid) {
		this.setSelectedName(selectedName);
		if (!valid) {
			selectedName = "/";
		} 
		this.$.hermesFileTree.gotoNodePath(selectedName);
	},
	/** @public */
	checkSelectedName: function(selectedName) {
		this.$.hermesFileTree.checkNodePath(selectedName);
	},
	$LS: function(msg, params) {
		var tmp = new enyo.g11n.Template($L(msg));
		return tmp.evaluate(params);
	}
});

