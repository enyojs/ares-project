enyo.kind({
	name: "CategoryItem",
	components: [
		{classes: "palette-category", components: [
			{ontap:"toggleDrawer", classes: "palette-category-name", components: [
				{name: "indicator", classes: "indicator turned"},
				{name: "name", tag:"span"}
			]},
			{kind: "onyx.Drawer", name:"drawer", open:true, components: [
				{name: "list", kind: "Repeater", count: 0, onSetupItem: "setupItem", components: [
					{kind: "PaletteItem"}
				]}
			]}
		]}
	],
	toggleDrawer: function() {
		var open = this.$.drawer.getOpen();
		this.$.drawer.setOpen(!open);
		this.$.indicator.addRemoveClass("turned", !open);
	},
	setModel: function(inModel) {
		this.model = inModel;
		this.$.name.setContent(this.model.name);
		this.$.list.count = this.model.items.length;
		this.$.list.build();
	},
	setupItem: function(inSender, inEvent) {
		inEvent.item.$.paletteItem.setModel(this.model.items[inEvent.index]); // <---- TODO - sibling reference, should be fixed up
		return true;
	}
});

enyo.kind({
	name: "PaletteItem",
	components: [
		{kind: "Control", classes: "palette-item", attributes: {draggable: true}, components: [
			{name: "icon", kind: "Image", showing: false},
			{name: "name"},
			{classes: "row-fluid", name: "client"}
		]}
	],
	handlers: {
		ondragstart: "decorateDragEvent"
	},
	//* On dragstart, add _this.config_ data to drag event
	decorateDragEvent: function(inSender, inEvent) {
		if(!inEvent.dataTransfer) {
			return true;
		}
		
		inEvent.config = this.config;
	},
	setModel: function(inModel) {
		if (inModel) {
			for (var n in inModel) {
				var c = this.$[n];
				if (c) {
					var v = inModel[n];
					if (c.kind == "Image") {
						c.setSrc("$deimos/images/" + v);
						c.setShowing(true);
					} else {
						c.setContent(v);
					}
				}
			}
			this.config = inModel.config;
		}
	}
});

enyo.kind({
	name: "Palette",
	style: "position: relative",
	published: {
		projectData: "",
		projectIndexer: ""
	},
	components: [
		{kind: "FittableRows", classes: "enyo-fit", components: [
			{kind: "Scroller", fit: true, components: [
				{name: "list", kind: "Repeater", count: 0, onSetupItem: "setupItem", components: [
					{kind: "CategoryItem"}
				]}
			]},
			{kind:"onyx.InputDecorator", style:"width:100%; margin-top:10px;", layoutKind:"FittableColumnsLayout", components: [
				{kind: "onyx.Input", fit:true, placeholder: "filter"},
				{kind: "onyx.Icon", src:"$deimos/images/search-input-search.png", style:"height:20px;"}
			]}
		]},
		{name: "serializer", kind: "Serializer"}
	],
	statics: {
		model: []
	},
	handlers: {
		ondragstart: "dragstart"
	},
	setupItem: function(inSender, inEvent) {
		var index = inEvent.index;
		var item = inEvent.item;
		item.$.categoryItem.setModel(this.palette[index]);
		return true;
	},
	dragstart: function(inSender, inEvent) {
		if(!inEvent.dataTransfer) {
			return false;
		}
		
		inEvent.dataTransfer.setData("ares/createitem", enyo.json.codify.to({config: inEvent.config}));
        return true;
	},
	/**
	 * Receive the project data reference which allows to access the analyzer
	 * output for the project's files, enyo/onyx and all the other project
	 * related information shared between phobos and deimos.
	 * @param  oldProjectData
	 * @protected
	 */
	projectDataChanged: function(oldProjectData) {
		if (this.projectData) {
			this.projectData.on('change:project-indexer', this.projectIndexReady, this);
			this.projectData.on('update:project-indexer', this.projectIndexerChanged, this);
			this.setProjectIndexer(this.projectData.getProjectIndexer());
		}
		if (oldProjectData) {
			oldProjectData.off('change:project-indexer', this.projectIndexReady);
			oldProjectData.off('update:project-indexer', this.projectIndexerChanged);
		}
	},
	/**
	 * The project analyzer output has changed
	 * @param value   the new analyzer output
	 * @protected
	 */
	projectIndexReady: function(model, value, options) {
		this.setProjectIndexer(value);
	},
	/**
	 * The current project analyzer output has changed
	 * Re-build the palette
	 * @param value   the new analyzer output
	 * @protected
	 */
	projectIndexerChanged: function() {
		var catchAllPalette = this.buildCatchAllPalette();
		this.palette = catchAllPalette.concat(this.projectIndexer.palette || []);
		this.palette.sort(function(a,b) {
			return (a.order || 0) - (b.order || 0);
		});
		this.$.list.count = this.palette.length;
		this.$.list.build();
	},
	/**
	 * Builds "catch-all palette" entries.  The standard palette comes from the projectIndexer's
	 * palette, which is built from palette categories and items specified in .design files included
	 * in package.js files included in the app's libs.  This function builds palette entries
	 * for any kinds that do not have palette enteries specified by .design files, allowing any
	 * kind to be usable in the designer.  We create a palette category for each kind namespace
	 * that contains a kind not assigned to a palette, and a catch-all category for non-namespaced kinds.
	 * @returns		Array containing catch-all palette categories
	 * @protected
	 */
	buildCatchAllPalette: function() {
		// Start custom palette with catch-all category for non-namespaced kinds
		var catchAllCategories = {
			"" : {
				order: 1100,
				name: "Custom Kinds",
				items: []
			}
		};
		// Get list of all public Components from indexer without palette meta-data, sorted by name
		var catchAllKinds = enyo.filter(this.projectIndexer.objects, function(o) {
			return (o.type == "kind") && (enyo.indexOf("enyo.Component", o.superkinds) >= 0) &&
					!o.hasPalette && (o.group == "public");
		}).sort(function(a,b) {
			return a.name.localeCompare(b.name);
		});
		
		// Add components to catch-all categories per namespace
		enyo.forEach(catchAllKinds, function(kind) {
			// Create palette item for kind
			var item = {
				name: kind.name,
				description: kind.comment,
				inline: {kind: kind.name},
				config: {kind: kind.name}
			};
			// Check for package namespace
			var dot = kind.name.lastIndexOf(".");
			if (dot > 0) {
				var pkg = kind.name.substring(0, dot);
				var cat = catchAllCategories[pkg];
				if (!cat) {
					// Generate a new custom palette for this package if it doesn't exist
					cat = {
						order: 1000,
						name: pkg + " (other)",
						items: []
					};
					catchAllCategories[pkg] = cat;
				}
				cat.items.push(item);
			} else {
				// No package, so add to catch-all category
				catchAllCategories[""].items.push(item);
			}
		});
		// Create the final custom palette array
		var catchAllPalette = [];
		for (var p in catchAllCategories) {
			if (catchAllCategories.hasOwnProperty(p)) {
				catchAllPalette.push(catchAllCategories[p]);
			}
		}
		return catchAllPalette;
	}
});
