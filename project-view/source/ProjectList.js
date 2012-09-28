enyo.kind({
	name: "ProjectList",
	classes: "enyo-unselectable",
	events: {
		onCreateProject: "",
		onProjectSelected: "",
		onOpenProject: ""
	},
	handlers: {
	},
	projects: [],
	components: [
	    {kind: "LocalStorage"},
	    {kind: "onyx.Toolbar", isContainer: true, name: "toolbar", components: [
			{kind: "onyx.Button", content: "Create Project", ontap: "doCreateProject"},
			{kind: "onyx.Button", content: "Open Project", ontap: "doOpenProject"}
		]},
	    {kind: "enyo.Scroller", components: [
			{kind: "enyo.Repeater", controlParentName: "client", fit: true, name: "projectList", onSetupItem: "projectListSetupItem", ontap: "projectListTap", components: [
                {kind: "Project", name: "item", classes: "enyo-children-inline ares_projectView_projectList_item"}
            ]}
		]}
    ],
	PROJECTS_STORAGE_KEY: "com.enyojs.ares.projects",
	create: function() {
		var self = this;
		this.inherited(arguments);
		this.$.localStorage.get(this.PROJECTS_STORAGE_KEY, function(data) {
			try {
				if (data && data !== "") {
					self.projects = JSON.parse(data);
				}
				self.$.projectList.setCount(self.projects.length);
			} catch(error) {
				self.error("Unable to retrieve projects information: " + error);	// TODO ENYO-1105
				console.dir(data);		// Display the offending data in the console
				self.$.localStorage.remove(self.PROJECTS_STORAGE_KEY); // Remove incorrect projects information
			}
		});
	},
	addProject: function(name, folderId, serviceId) {
		var self = this;
		var projectsString;
		var project = {name: name, folderId: folderId, serviceId: serviceId};
		this.projects.push(project);
		try {
			projectsString = JSON.stringify(this.projects, enyo.bind(this, this.stringifyReplacer));
		} catch(error) {
			this.error("Unable to store the project information: " + error);	// TODO ENYO-1105
			console.dir(this.projects);		// Display the offending object in the console
			return;
		}
		this.$.localStorage.set(this.PROJECTS_STORAGE_KEY, projectsString, function() {
			self.$.projectList.setCount(self.projects.length);
			self.$.projectList.render();
		});
	},
	projectListSetupItem: function(inSender, inEvent) {
	    var project = this.projects[inEvent.index];
	    var item = inEvent.item;
	    // setup the controls for this item.
	    item.$.item.setProjectName(project.name);
	},
    projectListTap: function(inSender, inEvent) {
    	this.doProjectSelected(this.projects[inEvent.index]);
    },
    stringifyReplacer: function(key, value) {
    	if (key === "originator") {
    		return undefined;	// Exclude
    	}
    	return value;	// Accept
    }
});

enyo.kind({
	name: "Project",
	published: {
		projectName: ""
	},
	components: [
	    {name: "name"}
	],
	projectNameChanged: function(inOldValue) {
        this.$.name.setContent(this.projectName);
    }
});