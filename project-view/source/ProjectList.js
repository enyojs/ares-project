/*global ServiceRegistry, ares */
/**
 * This kind provides:
 * - the project toolbars (with create .. delete)
 * - the project list
/*
 * The project list is a simple kind that only holds project names. It does not
 * hold project objects or kinds.
 */
enyo.kind({
	name: "ProjectList",
	kind: "FittableColumns",
	classes: "enyo-unselectable ares-project-list",
	events: {
		onCreateProject: "",
		onProjectSelected: "",
		onScanProject: "",
		onDuplicateProject: "",
		onProjectRemoved: "",
		onCloseProjectDocuments:"",
		onModifySettings: "",
		onBuild: "",
		onInstall: "",
		onRun: "",
		onRunDebug: "",
		onPreview: "",
		onError: "",
		onRegisterMe: ""
	},
	debug: false,
	components: [
		{kind:"FittableRows", classes:"project-list", components:[
			{kind: "onyx.MoreToolbar", classes: "ares-top-toolbar", isContainer: true, name: "toolbar", components: [
					{kind: "onyx.MenuDecorator", classes:"aresmenu", onSelect: "menuItemSelected", components: [
						{tag:"button", content: "Ares"},
						{kind: "onyx.Menu", floating: true, classes:"sub-aresmenu", components: [
							{value: "showAccountConfigurator", classes:"aresmenu-button", components: [
								{kind: "onyx.IconButton", src: "$project-view/assets/images/ares_accounts.png"},
								{content: "Accounts..."}
							]},
							{classes: "onyx-menu-divider aresmenu-button"},
							{value: "showAresProperties",  classes:"aresmenu-button", content: "Properties..."}
						]}
					]},
					{kind: "onyx.MenuDecorator", classes:"aresmenu", onSelect: "menuItemSelected", components: [
						{content: "Edit"},
						{kind: "onyx.Menu", floating: true, classes:"sub-aresmenu", components: [
							{value: "doCreateProject",  classes:"aresmenu-button", components: [
								{kind: "onyx.IconButton", src: "$project-view/assets/images/project_view_new.png"},
								{content: "Create..."}
							]},
							{classes: "onyx-menu-divider aresmenu-button"},
							{value: "doScanProject",  classes:"aresmenu-button", components: [
								{kind: "onyx.IconButton", src: "$project-view/assets/images/project_view_import.png"},
								{content: "Import..."}
							]},
							{classes: "onyx-menu-divider aresmenu-button"},
							{value: "doDuplicateProject",  classes:"aresmenu-button", components: [
								{kind: "onyx.IconButton", src: "$project-view/assets/images/project_view_import.png"},
								{content: "Duplicate..."}
							]},
							{classes: "onyx-menu-divider aresmenu-button"},
							{value: "removeProjectAction",  classes:"aresmenu-button", components: [
								{kind: "onyx.IconButton", src: "$project-view/assets/images/project_view_delete.png"},
								{content: "Delete"}
							]}
						]}
					]},
					{kind: "onyx.MenuDecorator", classes:"aresmenu", onSelect: "menuItemSelected", components: [
						{content: "Project", name: "projectMenu", disabled: true},
						{kind: "onyx.Menu", floating: true, classes:"sub-aresmenu", maxHeight: "100%", components: [
							{value: "doModifySettings",  classes:"aresmenu-button", components: [
								{kind: "onyx.IconButton", src: "$project-view/assets/images/project_view_edit.png"},
								{content: "Edit..."}
							]},
							{classes: "onyx-menu-divider aresmenu-button"},
							{value: "doPreview",  classes:"aresmenu-button", components: [
								{kind: "onyx.IconButton", src: "$project-view/assets/images/project_view_preview.png"},
								{content: "Preview"}
							]},
							{value: "doBuild",  classes:"aresmenu-button", components: [
								{kind: "onyx.IconButton", src: "$project-view/assets/images/project_view_build.png"},
								{content: "Build..."}
							]},
							{classes: "onyx-menu-divider aresmenu-button"},
							{value: "doInstall",  classes:"aresmenu-button", components: [
								{kind: "onyx.IconButton", src: "$project-view/assets/images/project_view_install.png"},
								{content: "Install..."}
							]},
							{classes: "onyx-menu-divider aresmenu-button"},
							{value: "doRun",  classes:"aresmenu-button", components: [
								{kind: "onyx.IconButton", src: "$project-view/assets/images/project_view_run.png"},
								{content: "Run..."}
							]},
							{value: "doRunDebug",  classes:"aresmenu-button", components: [
								{kind: "onyx.IconButton", src: "$project-view/assets/images/project_view_debug.png"},
								{content: "Debug..." }
							]}
						]}
					]}
			]},
			{content:"Project list", classes:"project-list-title title-gradient"},
			{kind: "enyo.Scroller", fit: true,components: [
				{tag:"ul", kind: "enyo.Repeater", classes:"ares-project-list-menu", controlParentName: "client", fit: true, name: "projectList", onSetupItem: "projectListSetupItem", ontap: "projectListTap", components: [
					{tag:"li",kind: "ProjectList.Project", name: "item"}
				]}
			]},
			{name: "removeProjectPopup", kind: "ProjectDeletePopup", onConfirmDeleteProject: "confirmRemoveProject"},
		{kind: "AccountsConfigurator"},
		{kind: "AresProperties"}
		]},
		{classes:"hangar"}
	],
	selected: null,
	create: function() {
		ares.setupTraceLogger(this);
		this.inherited(arguments);
		this.$.projectList.setCount(Ares.Workspace.projects.length);
		Ares.Workspace.projects.on("add remove reset", enyo.bind(this, this.projectCountChanged));
		this.doRegisterMe({name:"projectList", reference:this});
	},
	aresMenuTapped: function() {
		this.$.amenu.show();
		if(this.$.amenu.hasClass('on')) {
			this.$.amenu.removeClass('on');
		}
		else {
			this.$.amenu.addClass('on');
		}
	},
	aresMenuHide: function() {
		this.$.amenu.hide();
	},
	projectCountChanged: function() {
		var count = Ares.Workspace.projects.length;
		this.$.projectList.setCount(count);
		this.$.projectList.render();
		this.doProjectRemoved();		// To reset the Harmonia view
	},
	/**
	 * Generic event handler
	 * @private
	 */
	menuItemSelected: function(inSender, inEvent) {
		this.trace("sender:", inSender, ", event:", inEvent);
		var fn = inEvent && inEvent.selected && inEvent.selected.value;
		if (typeof this[fn] === 'function') {
			this[fn]({project: this.selectedProject});
		} else {
			this.trace("*** BUG: '", fn, "' is not a known function");
		}
	},
	addProject: function(name, folderId, service) {
		var serviceId = service.getConfig().id || "";
		if (serviceId === "") {
			throw new Error("Cannot add a project in service=" + service);
		}
		var known = Ares.Workspace.projects.get(name);
		if (known) {
			this.trace("Skipped project ", name, " as it is already listed") ;
		} else {
			var project = Ares.Workspace.projects.createProject(name, folderId, serviceId);
			if(project){
				this.selectInProjectList(project);
			}
		}
	},
	removeProjectAction: function(inSender, inEvent) {
		var popup = this.$.removeProjectPopup;
		if (this.selected) {
			popup.setName("Remove project");
			popup.setMessage("Remove project '" + this.selected.getProjectName() + "' from list?");
			popup.$.nukeFiles.setValue(false) ;
			popup.show();
		}
	},
	confirmRemoveProject: function(inSender, inEvent) {
		// use file system service to remove project files (which behaves like a 'rm -rf')
		// once done,  call removeSelectedProjectData to mop up the remains.
		var project, nukeFiles ;
		if (this.selected) {
			project = Ares.Workspace.projects.at(this.selected.index);
			nukeFiles = this.$.removeProjectPopup.$.nukeFiles.getValue() ;
			this.trace("removing project", project.getName(), ( nukeFiles ? " and its files" : "" )) ;
			this.trace(project);
			if (nukeFiles) {
				var service = project.getService();
				var folderId = project.getFolderId();
				service.remove( folderId )
					.response(this, function(){this.removeSelectedProjectData();})
					.error(this, function(inError){
						this.doError({msg: "Error removing files of project " + project.name + ": " + inError.toString(), err: inError});
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
			var project =  Ares.Workspace.projects.at(this.selected.index);
			var name = project.getName();
			Ares.Workspace.projects.removeProject(name);
			this.selected = null;
			this.doProjectRemoved();
			this.doCloseProjectDocuments({"project":project}); //To reset the designer panel
			this.$.projectMenu.setDisabled(true);
		}
	},
	projectListSetupItem: function(inSender, inEvent) {
		var project = Ares.Workspace.projects.at(inEvent.index);
		var item = inEvent.item;
		// setup the controls for this item.
		item = item.$.item;
		item.setProjectName(project.getName());
		item.setIndex(inEvent.index);
	},
	projectListTap: function(inSender, inEvent) {
		var project = Ares.Workspace.projects.at(inEvent.index);
		if(project) {
			this.selectInProjectList(project);
		}
	},
	selectInProjectList:function(project){
		var itemList = this.$.projectList.getClientControls();
		enyo.forEach(itemList, function(item) {
			item.$.item.removeClass("on");
			if(item.$.item.projectName === project.id){
				this.selected = item.$.item;
				item.$.item.addClass("on");
				this.selectProject(project);
			}
		}, this);
	},
	selectProject: function(project){
		var msg, service;
		service = ServiceRegistry.instance.resolveServiceId(project.getServiceId());
		if (service !== undefined) {
			project.setService(service);
			this.$.projectMenu.setDisabled(false);
			this.selectedProject = project;
			this.doProjectSelected({project: project});
		} else {
			// ...otherwise let
			msg = "Service " + project.getServiceId() + " not found";
			this.doError({msg: msg});
			this.error(msg);
		}
	},
	showAccountConfigurator: function() {
		this.$.accountsConfigurator.show();
	},
	showAresProperties: function(){
		this.$.aresProperties.show();
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
	kind: "control.Link",
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
	handlers: {
		onShow: "shown"
	},
	create: function() {
		this.inherited(arguments);
		this.createComponent(
				{container:this.$.popupContent, classes:"ares-more-row", components:[
					{kind: "onyx.Checkbox", checked: false, name: "nukeFiles", onchange: "nukeChanged"},
					{kind: "Control", tag: "span", classes: "ares-padleft", content: "also delete files from disk"}
				]}
		);
	},
	shown: function(inSender, inEvent) {
		this.nukeChanged();
	},
	nukeChanged: function(inSender, inEvent) {
		if (this.$.nukeFiles.checked) {
			this.$.actionButton.setContent("Delete");
		} else {
			this.$.actionButton.setContent("Remove");
		}
	}
});
