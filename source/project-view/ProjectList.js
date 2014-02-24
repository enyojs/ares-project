/*global Ares, ares, ServiceRegistry, ComponentsRegistry, enyo, async, ilibProjectView, setTimeout */


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
		onDisableProjectMenu: "",
		onError: "",
		onRegisterMe: "",
		onShowWaitPopup: "",
		onHideWaitPopup: ""
	},
	debug: false,
	components: [
		{kind:"FittableRows", classes: "project-list", components:[
			{kind: "onyx.MoreToolbar", classes: "ares-top-toolbar", isContainer: true, name: "toolbar", components: [
				{kind: "onyx.MenuDecorator", classes: "aresmenu", onSelect: "menuItemSelected", components: [
					{tag: "button", content: ilibProjectView("Ares")},
					{kind: "onyx.Menu", floating: true, classes: "sub-aresmenu", components: [
						{value: "showAccountConfigurator", classes: "aresmenu-button", components: [
							{kind: "onyx.IconButton", src: "$assets/project-view/images/ares_accounts.png", classes: "aresmenu-icon-button"},
							{content: ilibProjectView("Accounts..."), classes: "aresmenu-button-label"}
						]},
						{classes: "onyx-menu-divider aresmenu-button"},
						{value: "showAresAbout",  classes: "aresmenu-button", components: [
							{content: ilibProjectView("About..."), classes: "aresmenu-button-label"}
						]},
						{classes: "onyx-menu-divider aresmenu-button"},
						{value: "showAresProperties",  classes: "aresmenu-button", components: [
							{content: ilibProjectView("Properties..."), classes: "aresmenu-button-label"}
						]},
						{classes: "onyx-menu-divider aresmenu-button"},
						{value: "showEnyoHelp",  classes: "aresmenu-button", components: [
							{content: ilibProjectView("Enyo API Viewer"), classes: "aresmenu-button-label"}
						]}
					]}
				]},
				{kind: "onyx.MenuDecorator", classes:"aresmenu", onSelect: "menuItemSelected", components: [
					{content: ilibProjectView("Projects")},
					{kind: "onyx.Menu", floating: true, classes: "sub-aresmenu", components: [
						{value: "doCreateProject",  classes: "aresmenu-button", components: [
							{kind: "onyx.IconButton", src: "$assets/project-view/images/project_view_new.png"},
							{content: ilibProjectView("New...")}
						]},
						{classes: "onyx-menu-divider aresmenu-button"},
						{value: "doOpenProject",  classes: "aresmenu-button", components: [
							{kind: "onyx.IconButton", src: "$assets/project-view/images/project_view_open.png"},
							{content: ilibProjectView("Open...")}
						]},
						{value: "doSearchProjects",  classes: "aresmenu-button", components: [
							{kind: "onyx.IconButton", src: "$assets/project-view/images/project_view_search.png"},
							{content: ilibProjectView("Search...")}
						]},
						{classes: "onyx-menu-divider aresmenu-button"},
						{value: "doDuplicateProject",  classes: "aresmenu-button", components: [
							{kind: "onyx.IconButton", src: "$assets/project-view/images/project_view_duplicate.png"},
							{content: ilibProjectView("Duplicate...")}
						]},
						{classes: "onyx-menu-divider aresmenu-button"},
						{value: "removeProjectAction",  classes: "aresmenu-button", components: [
							{kind: "onyx.IconButton", src: "$assets/project-view/images/project_view_delete.png"},
							{content: ilibProjectView("Delete")}
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
			{kind: "AresProperties"},
			{name: "about", kind: "AboutAres"}
		]},
		{classes:"hangar"}
	],
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
		} else {
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
				this.selectProject(project, ares.noNext);
			}
		}
	},
	removeProjectAction: function(inSender, inEvent) {
		var popup = this.$.removeProjectPopup;
		if (this.selectedProject) {
			popup.setTitle(ilibProjectView("Remove project"));
			popup.setMessage(ilibProjectView("Remove project '{projectName}' from list?", {projectName: this.selectedProject.getName()}));
			popup.set("nukeFiles", false) ;
			popup.show();
		}
	},

	removeProject: function (nukeFiles, project, next) {
		// when nukeFiles is set, use file system service to remove
		// project files (which behaves like a 'rm -rf') once done,
		// call removeSelectedProjectData to mop up the remains.

		this.trace("removing project", project.getName()) ;

		if (nukeFiles) {
			this.trace("removing project", project.getName() ,"files") ;
			var msgForDeletedProject = "Deleting files of project " + project.getName();
			this.doShowWaitPopup({msg: msgForDeletedProject});

			var service = project.getService();
			var folderId = project.getFolderId();
			service.remove( folderId )
				.response(this, function(){
					this.trace("removed project", project.getName() ,"files") ;
					this.doHideWaitPopup();
					this.removeProjectData(project, next);
				})
				.error(this, function(inError){
					this.trace("failed to remove project", project.getName() ,"files", inError) ;
					this.doHideWaitPopup();
					next(inError);
				}) ;
		} else {
			this.removeProjectData(project, next) ;
		}
	},

	confirmRemoveProject: function(inSender, inEvent) {
		var project = this.selectedProject ;
		var nukeFiles = this.$.removeProjectPopup.get("nukeFiles");
		var editor = ComponentsRegistry.getComponent("enyoEditor");

		if (project) {
			async.series(
				[
					editor.requestCloseProject.bind(editor, project),
					this.removeProject.bind(this, nukeFiles, project)
				],
				function(err){
					if (err) {
						this.doError({msg: "Error removing files of project " + project.name + ": " + err.toString(), err: err});
					}
				}
			);
		}
	},
	removeProjectData: function(project,next) {
		var name = project.getName();

		if (name === this.selectedProject.getName()) {
			this.trace("called on selected " + name);
			this.selectedProject = null;
			this.doProjectRemoved();
			this.doDisableProjectMenu({disable: true});
		} else {
			this.trace("called on " + name);
		}

		// remove the project from list of project config
		Ares.Workspace.projects.removeProject(name);
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
			this.selectProject(project, ares.noNext);
		}
	},
	_selectInProjectList:function(project){
		var itemList = this.$.projectList.getClientControls();
		enyo.forEach(itemList, function(item) {
			item.$.item.removeClass("on");
			if(item.$.item.projectName === project.id){
				item.$.item.addClass("on");
			}
		}, this);
	},

	/**
	 * Select a project
	 * @param {Object} project
	 * @param {Function} next
	 */
	selectProject: function(project,next){
		var msg, service;
		var bailout = 0;
		var err ;
		var oldp = this.selectedProject;
		var oldn = oldp ? oldp.getName() : '';
		var newn = project.getName();
		var that = this;
		this.trace("select project " + newn + (oldp ? " old " + oldn : '') );

		var selectNext = function(err) {
			var pending = that.pendingSelect ;
			that.trace("end of selection of project " + newn);
			that.pendingSelect = null;
			that.ongoingSelect = null;

			if (err) {
				setTimeout(function() {next(err);},0);
			} else if (pending) {
				that.trace("selecting pending project " + pending.getName() );
				that.selectProject(pending, next);
			} else {
				setTimeout(next,0);
			}
		};

		if (this.ongoingSelect) {
			this.trace("on-going select project " + oldn + " storing request for " + newn );
			this.pendingSelect = project; // may clobber previous pending select
			bailout = 1;
		}

		if (newn === oldn) {
			this.trace("drop redundant select project " + oldn );
			bailout = 1;
		}

		service = ServiceRegistry.instance.resolveServiceId(project.getServiceId());

		if (service === undefined) {
			msg = "Service " + project.getServiceId() + " not found";
			this.doError({msg: msg});
			err = new Error(msg);
			bailout = 1;
		}

		if (bailout) {
			setTimeout(function(){ selectNext(err); },0);
			return;
		}


		this._selectInProjectList(project);

		this.ongoingSelect = project;

		project.setService(service);
		this.doDisableProjectMenu({disable: false});

		// setupProjectConfig checks for redundant setup wrt this.selectedProject
		this.owner.setupProjectConfig( project, selectNext );
		// so this attribute must be set after calling setupProjectConfig
		this.selectedProject = project;
		// save the selected project in the model 
		Ares.Workspace.projects.setSelectedProject(project.getName());
	},

	getSelectedProject: function() {
		return this.selectedProject;
	},

	showAccountConfigurator: function() {
		this.$.accountsConfigurator.show();
	},
	showAresAbout: function(){
		this.$.about.show();
	},
	showAresProperties: function(){
		this.$.aresProperties.show();
		this.$.aresProperties.initDrawers();
	},
	showEnyoHelp: function() {
		var search = ComponentsRegistry.getComponent("enyoEditor").requestSelectedText();
		
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
			{container: this.$.popupContent, classes: "ares-more-row", components:[
				{kind: "onyx.Checkbox", checked: false, name: "nukeFiles", onActivate: "changeNuke"},
				{kind: "Control", tag: "span", classes: "ares-padleft", content: ilibProjectView("also delete files from disk")}
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
			this.setActionButton(ilibProjectView("Delete"));
		} else {
			this.setActionButton(ilibProjectView("Remove"));
		}
	}
});
