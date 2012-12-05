/**
 * This kind provides:
 * - the project toolbars (with create .. delete)
 * - the project list
 * 
 * The project list is a simple kind that only holds project names. It does not
 * hold project objects or kinds.
 */
enyo.kind({
	name: "ProjectList",
	classes: "enyo-unselectable",
	events: {
		onCreateProject: "",
		onProjectSelected: "",
		onScanProject: "",
		onProjectRemoved: "",
		onModifySettings: "",
		onPhonegapBuild: ""
	},
	handlers: {
	},
	debug: true,
	components: [
		{kind: "onyx.Toolbar",	classes: "onyx-menu-toolbar ares_harmonia_toolBar ares-no-padding", isContainer: true, name: "toolbar", components: [
			{kind: "onyx.MenuDecorator", onSelect: "aresMenuItemSelected", components: [
				{content: "Ares"},
				{kind: "onyx.Menu", components: [
					{value: "showAccountConfigurator", components: [
						{kind: "onyx.IconButton", src: "$project-view/assets/images/ares_accounts.png"},
						{content: "Accounts..."}
					]},
					{classes: "onyx-menu-divider"},
					{content: "Properties..."}
				]}
			]},
			{kind: "onyx.TooltipDecorator", components: [
				{kind: "onyx.IconButton", classes: "ares-scale-background", src: "$project-view/assets/images/project_settings.png", onclick: "doModifySettings"},
				{kind: "onyx.Tooltip", content: "Settings..."}
			]},
			{kind: "onyx.TooltipDecorator", components: [
				{kind: "onyx.IconButton", src: "$project-view//assets/images/project_view_new.png", onclick: "doCreateProject"},
				{kind: "onyx.Tooltip", content: "Create or Import Project..."}
			]},
			{kind: "onyx.TooltipDecorator", components: [
				{kind: "onyx.IconButton", src: "$project-view//assets/images/project_view_edit.png", onclick: "doScanProject"},
				{kind: "onyx.Tooltip", content: "Scan for Projects..."}
			]},
			{kind: "onyx.TooltipDecorator", components: [
				{kind: "onyx.IconButton", src: "$project-view//assets/images/project_view_delete.png", onclick: "removeProjectAction"},
				// FIXME: tooltip goes under File Toolbar, there's an issue with z-index stuff
				{kind: "onyx.Tooltip", content: "Remove Project..."}
			]},
			{kind: "onyx.TooltipDecorator", components: [
				{kind: "onyx.IconButton", src: "$project-view//assets/images/project_view_build.png", onclick: "doPhonegapBuild"},
				{kind: "onyx.Tooltip", content: "Phonegap build"}
			]}
		]},
		{kind: "enyo.Scroller", components: [
			{kind: "enyo.Repeater", controlParentName: "client", fit: true, name: "projectList", onSetupItem: "projectListSetupItem", ontap: "projectListTap", components: [
				{kind: "ProjectList.Project", name: "item", classes: "enyo-children-inline ares_projectView_projectList_item"}
			]}
		]},
		{name: "removeProjectPopup", kind: "ProjectDeletePopup", onConfirmDeleteProject: "confirmRemoveProject"},
		{name: "errorPopup", kind: "Ares.ErrorPopup", msg: "unknown error"},
		{kind: "AccountsConfigurator"},
		{kind: "Signals", onServicesChange: "handleServicesChange"}
	],
	selected: null,
	create: function() {
		this.inherited(arguments);
		this.$.projectList.setCount(Ares.WorkspaceData.length);
		Ares.WorkspaceData.on("add remove reset", enyo.bind(this, this.projectCountChanged));
	},
	projectCountChanged: function() {
		var count = Ares.WorkspaceData.length;
		this.log("NEW COUNT: " + count);
		this.$.projectList.setCount(count);
		this.$.projectList.render();
		this.doProjectRemoved();		// To reset the Harmonia view
	},
	addProject: function(name, folderId, service) {
		var serviceId = service.getConfig().id || "";
		if (serviceId === "") {
			throw new Error("Cannot add a project in service=" + service);
		}
		var known = Ares.WorkspaceData.get(name);
		if (known) {
			this.log("Skipped project " + name + " as it is already listed") ;
		} else {
			Ares.WorkspaceData.createProject(name, folderId, serviceId);
		}
	},
	removeProjectAction: function(inSender, inEvent) {
		var popup = this.$.removeProjectPopup;
		if (this.selected) {
			popup.setName("Delete project '" + this.selected.getProjectName() + "' ?");
			popup.$.nukeFiles.setValue(false) ;
			popup.show();
		}
	},
	confirmRemoveProject: function(inSender, inEvent) {
		// use file system service to remove project files (which behaves like a 'rm -rf')
		// once done,  call removeSelectedProjectData to mop up the remains.
		var project, nukeFiles ;
		if (this.selected) {
			project = Ares.WorkspaceData.at(this.selected.index);
			nukeFiles = this.$.removeProjectPopup.$.nukeFiles.getValue() ;
			this.log("removing project" +  project.getName() + ( nukeFiles ? " and its files" : "" )) ;
			this.debug && this.log(project);
			if (nukeFiles) {
				project.service.remove( project.folderId )
					.response(this, function(){this.removeSelectedProjectData();})
					.error(this, function(inError){
						this.showErrorPopup("Error removing files of project " + project.name + ": " + inError);
					}) ;
			}
			else {
				this.removeSelectedProjectData() ;
			}
		}
	},
	removeSelectedProjectData: function() {
		if (this.selected) {
			// remove the project from list of project config
			var name = Ares.WorkspaceData.at(this.selected.index).getName();
			Ares.WorkspaceData.removeProject(name);
			this.selected = null;
			this.doProjectRemoved();
		}
	},
	projectListSetupItem: function(inSender, inEvent) {
		var project = Ares.WorkspaceData.at(inEvent.index);
		var item = inEvent.item;
		// setup the controls for this item.
		item = item.$.item;
		item.setProjectName(project.getName());
		item.setIndex(inEvent.index);
	},
	projectListTap: function(inSender, inEvent) {
		var project, msg, service;
		// Un-highlight former selection, if any
		if (this.selected) {
			this.selected.removeClass("ares_projectView_projectList_item_selected");
		}

		// Highlight the new project item
		if (inEvent.originator.kind === 'ProjectList.Project') {
			this.selected = inEvent.originator;
		} else {
			this.selected = inEvent.originator.owner;
		}
		this.selected.addClass("ares_projectView_projectList_item_selected");

		project = Ares.WorkspaceData.at(inEvent.index);
		service = ServiceRegistry.instance.resolveServiceId(project.getServiceId());
		if (service !== undefined) {
			project.setService(service);
			this.doProjectSelected({project: project});
		} else {
			// ...otherwise let
			msg = "Service " + project.getServiceId() + " not found";
			this.showErrorPopup(msg);
			this.error(msg);
		}
	},
	showAccountConfigurator: function() {
		this.$.accountsConfigurator.show();
	},
	aresMenuItemSelected: function(inSender, inEvent) {
		if (this.debug) this.log("sender:", inSender, ", event:", inEvent);
		if (typeof this[inEvent.selected.value] === 'function') {
			this[inEvent.selected.value]();
		}
	},
	showErrorPopup : function(msg) {
		this.$.errorPopup.setErrorMsg(msg);
		this.$.errorPopup.show();
	},
	stringifyReplacer: function(key, value) {
		if (key === "originator") {
			return undefined;	// Exclude
		}
		return value;	// Accept
	},
	statics: {
		underTest: false
	}
});

enyo.kind({
	name: "ProjectList.Project",
	published: {
		projectName: "",
		index: -1
	},
	components: [
		{name: "name"}
	],
	projectNameChanged: function(inOldValue) {
		this.$.name.setContent(this.projectName);
	}
});

enyo.kind({
	name: "ProjectDeletePopup",
	kind: "Ares.ActionPopup",
	components: [
		{kind: "Control", tag: "h3", content: " ", name: "title"},
		{kind: "Control", tag: "br"},
		{kind: "onyx.Checkbox", checked: false, name: "nukeFiles"},
		{kind: "Control", tag: "span", style: "padding: 0 4px; vertical-align: middle;", content: "also delete files", fit: true},
		{kind: "FittableColumns", name: "buttons", components: [
			{kind: "onyx.Button", classes: "onyx-negative", content: "Cancel", name: "cancelButton", ontap: "actionCancel"},
			{kind: "onyx.Button", classes: "onyx-affirmative", content: "Delete", name: "actionButton", ontap: "actionConfirm"}
		]}
	]
});
