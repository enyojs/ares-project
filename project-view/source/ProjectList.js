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
	projects: [],
	debug: false,
	components: [
		{kind: "LocalStorage"},
		{kind: "onyx.Toolbar",	classes: "onyx-menu-toolbar", isContainer: true, name: "toolbar", components: [
			{content: "Projects", style: "margin-right: 10px"},
				{kind: "onyx.TooltipDecorator", components: [
				{kind: "onyx.IconButton", src: "$project-view/images/project_settings.png", onclick: "doModifySettings"},
				{kind: "onyx.Tooltip", content: "Settings..."},
			]},
			{kind: "onyx.TooltipDecorator", components: [
				{kind: "onyx.IconButton", src: "$project-view/images/project_view_new.png", onclick: "doCreateProject"},
				{kind: "onyx.Tooltip", content: "Create or Import Project..."},
			]},
			{kind: "onyx.TooltipDecorator", components: [
				{kind: "onyx.IconButton", src: "$project-view/images/project_view_edit.png", onclick: "doScanProject"},
				{kind: "onyx.Tooltip", content: "Scan for Projects..."},
			]},
			{kind: "onyx.TooltipDecorator", components: [
				{kind: "onyx.IconButton", src: "$project-view/images/project_view_delete.png", onclick: "removeProjectAction"},
				// FIXME: tooltip goes under File Toolbar, there's an issue with z-index stuff
				{kind: "onyx.Tooltip", content: "Remove Project..."},
			]},
			{kind: "onyx.TooltipDecorator", components: [
				{kind: "onyx.IconButton", src: "$project-view/images/project_view_build.png", onclick: "doPhonegapBuild"},
				{kind: "onyx.Tooltip", content: "Phonegap build"},
			]}
		]},
		{kind: "enyo.Scroller", components: [
			{kind: "enyo.Repeater", controlParentName: "client", fit: true, name: "projectList", onSetupItem: "projectListSetupItem", ontap: "projectListTap", components: [
				{kind: "ProjectList.Project", name: "item", classes: "enyo-children-inline ares_projectView_projectList_item"}
			]}
		]},
		{name: "removeProjectPopup", kind: "ProjectDeletePopup", onConfirmDeleteProject: "confirmRemoveProject"},
		{name: "errorPopup", kind: "Ares.ErrorPopup", msg: "unknown error"},
		{kind: "Signals", onServicesChange: "handleServicesChange"}
	],
	PROJECTS_STORAGE_KEY: "com.enyojs.ares.projects",
	selected: null,
	create: function() {
		this.inherited(arguments);
		this.$.localStorage.get(this.PROJECTS_STORAGE_KEY, enyo.bind(this, this.projectListAvailable));
	},
	/**
	 * Receive the {onServicesChange} broadcast notification
	 * @param {Object} inEvent.serviceRegistry
	 */
	handleServicesChange: function(inSender, inEvent) {
		if (this.debug) this.log(inEvent);
		this.serviceRegistry = inEvent.serviceRegistry;
	},
	/**
	 * Callback functions which receives the project list data read from the storage
	 * @protected
	 * @param data: the project list in json format
	 */
	projectListAvailable: function(data) {
		try {
			if (data && data !== "") {
				this.projects = JSON.parse(data);
				if (this.debug) console.dir(this.projects);
			}
			this.$.projectList.setCount(this.projects.length);
		} catch(error) {
			this.error("Unable to retrieve projects information: " + error);	// TODO ENYO-1105
			console.dir(data);	// Display the offending data in the console
			this.$.localStorage.remove(this.PROJECTS_STORAGE_KEY); // Remove incorrect projects information
			this.projects = [];
		}
	},
	storeProjectsInLocalStorage: function() {
		var projectsString;
		if (this.debug) console.dir(this.projects);
		try {
			projectsString = JSON.stringify(this.projects, enyo.bind(this, this.stringifyReplacer));
		} catch(error) {
			this.error("Unable to store the project information: " + error);	// TODO ENYO-1105
			console.dir(this.projects);		// Display the offending object in the console
			return;
		}
		this.$.localStorage.set(this.PROJECTS_STORAGE_KEY, projectsString, function() {
			// WARNING: LocalStorage does not return any information about operation status (success or error)
			enyo.log("Project list saved");
		});
	},
	addProject: function(name, folderId, service) {
		var project = {
			name: name,
			folderId: folderId,
			serviceId: service.getConfig().id
		};
		if (!project.serviceId) {
			throw new Error("Cannot add a project in service=" + service);
		}
		var known = 0;
		var match = function(proj) {
			if ( proj.name === name) {
				known = 1;
			} 
		} ;
		enyo.forEach(this.projects, match) ;
		if (known) {
			this.log("Skipped project " + name + " as it is already listed") ;
		}
		else {
			this.projects.push(project);
			this.storeProjectsInLocalStorage();
			this.$.projectList.setCount(this.projects.length);
			this.$.projectList.render();
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
			project = this.projects[this.selected.index] ;
			nukeFiles = this.$.removeProjectPopup.$.nukeFiles.getValue() ;
			this.log("removing project" +  project.name + ( nukeFiles ? " and its files" : "" )) ;
			this.debug && this.log(project) ;
			if (nukeFiles) {
				// FIXME: shouldn't impl be private stuff ?
				project.service.impl.remove( project.folderId )
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
			this.projects.splice(this.selected.index, 1);
			this.storeProjectsInLocalStorage();
			this.selected = null;
			this.$.projectList.setCount(this.projects.length);
			this.$.projectList.render();
			this.doProjectRemoved();
		}
	},
	projectListSetupItem: function(inSender, inEvent) {
		var project = this.projects[inEvent.index];
		var item = inEvent.item;
		// setup the controls for this item.
		item = item.$.item;
		item.setProjectName(project.name);
		item.setIndex(inEvent.index);
	},
	projectListTap: function(inSender, inEvent) {
		var project, msg;
		// Un-highlight former selection, if any
		if (this.selected) {
			this.selected.removeClass("ares_projectView_projectList_item_selected");
		}
		project = this.projects[inEvent.index];
		project.service = this.serviceRegistry.resolveServiceId(project.serviceId);
		if (project.service) {
			// Highlight a project item if & only if its
			// filesystem service provider exists.
			if (inEvent.originator.kind === 'ProjectList.Project') {
				this.selected = inEvent.originator;
			} else {
				this.selected = inEvent.originator.owner;
			}
			this.selected.addClass("ares_projectView_projectList_item_selected");
			this.doProjectSelected({project: project});
		} else {
			// ...otherwise let 
			msg = "Service " + project.serviceId + " not found";
			this.showErrorPopup(msg);
			this.error(msg);
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
