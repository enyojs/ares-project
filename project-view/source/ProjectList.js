/*global Ares, ares, ServiceRegistry, ComponentsRegistry, enyo */


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
	kind: "FittableColumns",
	classes: "enyo-unselectable ares-project-list",
	events: {
		onCreateProject: "",
		onOpenProject: "",
		onSearchProjects: "",
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
		onRegisterMe: "",
		onShowWaitPopup: "",
		onHideWaitPopup: ""
	},
	debug: false,
	components: [
		{kind:"FittableRows", classes:"project-list", components:[
			{kind: "onyx.MoreToolbar", classes: "ares-top-toolbar", isContainer: true, name: "toolbar", components: [
				{kind: "onyx.MenuDecorator", classes:"aresmenu", onSelect: "menuItemSelected", components: [
					{tag:"button", content: "Ares"},
					{kind: "onyx.Menu", floating: true, classes:"sub-aresmenu", components: [
						{value: "showAccountConfigurator", classes:"aresmenu-button", components: [
							{kind: "onyx.IconButton", src: "$project-view/assets/images/ares_accounts.png", classes: "aresmenu-icon-button"},
							{content: "Accounts...", classes: "aresmenu-button-label"}
						]},
						{classes: "onyx-menu-divider aresmenu-button"},
						{value: "showAresProperties",  classes:"aresmenu-button", components: [
							{content: "Properties...", classes: "aresmenu-button-label"}
						]},
						{classes: "onyx-menu-divider aresmenu-button"},
						{value: "showEnyoHelp",  classes:"aresmenu-button", components: [
							{content: "Enyo API Viewer", classes: "aresmenu-button-label"}
						]}
					]}
				]},
				{kind: "onyx.MenuDecorator", classes:"aresmenu", onSelect: "menuItemSelected", components: [
					{content: "Projects"},
					{kind: "onyx.Menu", floating: true, classes:"sub-aresmenu", components: [
						{value: "doCreateProject",  classes:"aresmenu-button", components: [
							{kind: "onyx.IconButton", src: "$project-view/assets/images/project_view_new.png"},
							{content: "New..."}
						]},
						{classes: "onyx-menu-divider aresmenu-button"},
						{value: "doOpenProject",  classes:"aresmenu-button", components: [
							{kind: "onyx.IconButton", src: "$project-view/assets/images/project_view_open.png"},
							{content: "Open..."}
						]},
						{value: "doSearchProjects",  classes:"aresmenu-button", components: [
							{kind: "onyx.IconButton", src: "$project-view/assets/images/project_view_search.png"},
							{content: "Search..."}
						]},
						{classes: "onyx-menu-divider aresmenu-button"},
						{value: "doDuplicateProject",  classes:"aresmenu-button", components: [
							{kind: "onyx.IconButton", src: "$project-view/assets/images/project_view_duplicate.png"},
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
			{name: "removeProjectPopup", kind: "ProjectDeletePopup", onConfirmActionPopup: "confirmRemoveProject"},
			{kind: "AccountsConfigurator"},
			{kind: "AresProperties"}
		]},
		{classes:"hangar"}
	],
	selected: null,
	enyoHelpTab: null,
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
	addProject: function(name, folderId, service, dontSelect) {
		var serviceId = service.getConfig().id || "";
		if (serviceId === "") {
			throw new Error("Cannot add a project in service=" + service);
		}
		var known = Ares.Workspace.projects.get(name);
		if (known) {
			this.log("Skipped project ", name, " as it is already listed") ;
		} else {
			var project = Ares.Workspace.projects.createProject(name, folderId, serviceId);
			if(project && !dontSelect){
				this.selectInProjectList(project);
			}
		}
	},
	removeProjectAction: function(inSender, inEvent) {
		var popup = this.$.removeProjectPopup;
		if (this.selected) {
			popup.setTitle($L("Remove project"));
			popup.setMessage(this.$LS("Remove project '#{projectName}' from list?", {projectName: this.selected.getProjectName()}));
			popup.set("nukeFiles", false) ;
			popup.show();
		}
	},

	removeProject: function (nukeFiles, project, next) {
		// when nukeFiles is set, use file system service to remove
		// project files (which behaves like a 'rm -rf') once done,
		// call removeSelectedProjectData to mop up the remains.

		var msgForDeletedProject = "Deleting project " + project.getName();
		this.doShowWaitPopup({msg: msgForDeletedProject});

		this.trace("removing project", project.getName(), ( nukeFiles ? " and its files" : "" )) ;

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
		this.doHideWaitPopup();
	},

	confirmRemoveProject: function(inSender, inEvent) {
		var project = Ares.Workspace.projects.at(this.selected.index);
		var nukeFiles = this.$.removeProjectPopup.get("nukeFiles");
		var editor = ComponentsRegistry.getComponent("enyoEditor");

		if (this.selected) {
			this.removeProject(nukeFiles, project);
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
	selectInProjectList:function(project, next){
		this.trace("select ",project);
		var oldProject = this.selectedProject ;

		// do something only if project is actually changed
		if (oldProject && oldProject.getName() === project.getName()) {
			if (next) {next();}
			return;
		}

		var itemList = this.$.projectList.getClientControls();
		enyo.forEach(itemList, function(item) {
			item.$.item.removeClass("on");
			if(item.$.item.projectName === project.id){
				this.selected = item.$.item;
				item.$.item.addClass("on");
				this.selectProject(project,next);
			}
		}, this);
	},
	selectProject: function(project,next){
		var msg, service;
		this.trace("project ",project, " old ", this.selectedProject);
		service = ServiceRegistry.instance.resolveServiceId(project.getServiceId());
		if (service !== undefined) {
			project.setService(service);
			this.$.projectMenu.setDisabled(false);
			this.selectedProject = project;
			this.owner.setupProjectConfig( project, next );
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
	showEnyoHelp: function() {
		var search = ComponentsRegistry.getComponent("phobos").requestSelectedText();
		
		if (this.enyoHelpTab && !this.enyoHelpTab.closed) {
			this.enyoHelpTab.focus();
			if (search !== "") {
				this.enyoHelpTab = window.open("http://enyojs.com/api/#" + search,
							       "Enyo API Viewer",
							       "resizable=1, dependent=yes, width=800, height=600");
			}
			return;
		}
		
		if (search !== "") {
			search = "#" + search;
		}
		this.enyoHelpTab = window.open("http://enyojs.com/api/" + search,
					       "Enyo API Viewer",
					       "resizable=1, dependent=yes, width=800, height=600");
	},
	stringifyReplacer: function(key, value) {
		if (key === "originator") {
			return undefined;	// Exclude
		}
		return value;	// Accept
	},
	$LS: function(msg, params) {
		var tmp = new enyo.g11n.Template($L(msg));
		return tmp.evaluate(params);
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
	nukeFiles: false,
	/** @private */
	create: function() {
		ares.setupTraceLogger(this);
		this.inherited(arguments);
		this.createComponent(
			{container:this.$.popupContent, classes:"ares-more-row", components:[
				{kind: "onyx.Checkbox", checked: false, name: "nukeFiles", onActivate: "changeNuke"},
				{kind: "Control", tag: "span", classes: "ares-padleft", content: $L("also delete files from disk")}
			]}
		);
		this.changeNuke();
	},
	/** @private */
	nukeFilesChanged: function(inOldValue) {
		this.$.nukeFiles.set("checked", this.nukeFiles);
		this.changeNuke();
	},
	/** @private */
	changeNuke: function(inSender, inEvent) {
		this.nukeFiles = this.$.nukeFiles.checked;
		if (this.$.nukeFiles.checked) {
			this.setActionButton($L("Delete"));
		} else {
			this.setActionButton($L("Remove"));
		}
	}
});
