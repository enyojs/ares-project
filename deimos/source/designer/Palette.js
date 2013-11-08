/* global ares */
enyo.kind({
	name: "CategoryItem",
	components: [
		{classes: "palette-category", components: [
			{ontap: "toggleDrawer", classes: "palette-category-name", components: [
				{name: "indicator", classes: "indicator turned"},
				{name: "name", tag: "span"}
			]},
			{kind: "onyx.Drawer", name: "drawer", open:true, components: [
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
		if (this.$.list.count === 0 && this.$.drawer.getOpen()) {
			this.toggleDrawer();
		}
		this.$.list.build();
		if (this.$.name.content === "ignore") {
			this.hide();
		}
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
		inEvent.options = this.options;
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
			this.options = inModel.options;
		}
	}
});

enyo.kind({
	name: "Palette",
	style: "position: relative",
	published: {
		projectIndexer: ""
	},
	debug: false,
	components: [
		{kind: "FittableRows", classes: "enyo-fit", components: [
			{kind: "Scroller", fit: true, components: [
				{classes: "palette-category-all", components: [
					{ontap: "toggleComponents", classes: "palette-category-name", components: [
						{name: "indicator", classes: "indicator turned"},
						{name: "name", tag: "span"}
					]},
					{kind: "onyx.Drawer", name: "drawer", open:true, components: [
						{name: "list", kind: "Repeater", count: 0, onSetupItem: "setupItem", components: [
							{kind: "CategoryItem"}
						]}
					]}
				]}
			]},
			{kind: "onyx.InputDecorator", style: "width:100%; margin-top:10px;", layoutKind: "FittableColumnsLayout", components: [
				{kind: "onyx.Input", name: "filterPalette", fit:true, placeholder: "filter", oninput: "paletteFiltering"},
				{kind: "onyx.Icon", name: "filterPaletteIcon", src: "$deimos/images/search-input-search.png", style: "height:20px;", ontap: "resetFilter"}
			]}
		]}
	],
	handlers: {
		ondragstart: "dragstart"
	},
	create: function () {
		ares.setupTraceLogger(this);
		this.inherited(arguments);
	},
	setupItem: function(inSender, inEvent) {
		var index = inEvent.index;
		var item = inEvent.item;
		item.$.categoryItem.setModel(this.palette[index]);
		// Sets the title of all component toggle
		this.$.name.setContent("UI Components");
		return true;
	},
	dragstart: function(inSender, inEvent) {
		if(!inEvent.dataTransfer) {
			return true;
		}

		var dragData = {
			type: "ares/createitem",
			item: {
				config: inEvent.config,
				options: inEvent.options
			}
		};
		
		inEvent.dataTransfer.setData("text", enyo.json.codify.to(dragData));
	},
	/**
	 * Toggles all UI components
	 * @private 
	 */
	toggleComponents: function() {
		var open = this.$.drawer.getOpen();
		this.$.drawer.setOpen(!open);
		this.$.indicator.addRemoveClass("turned", !open);
	},
	/**
	 * The current project analyzer output has changed
	 * Re-build the palette
	 * @param value   the new analyzer output
	 * @protected
	 */
	projectIndexerChanged: function() {
		this.trace("projectIndexerChanged: rebuilt the palette ");
		
		var catchAllPalette = this.buildCatchAllPalette();
		var allPalette = ares.clone(catchAllPalette.concat(this.projectIndexer.design.palette || []));
		
		var filterString = this.$.filterPalette.getValue().toLowerCase();
		if (filterString !== "") {
			var k;
			enyo.forEach(allPalette, function(category) {
				for (k = 0; k < category.items.length; k++) {
					if (category.items[k].name.toLowerCase().indexOf(filterString) == -1) {
						category.items.splice(k, 1);
						k--;
					}
				}
			}, this);
		}
		
		this.palette = allPalette;
		this.palette.sort(function(a,b) {
			return (a.name || "").localeCompare(b.name || "") + (a.order || 0) - (b.order || 0);
		});
				
		// count reset must be forced
		this.$.list.set("count", 0);
		this.$.list.set("count", this.palette.length);
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
				order: 11000,
				name: "Custom Kinds",
				items: []
			}
		};
		// Get all kinds from .design files if .design exist
		var catchKindListInPalette = [];
		if (this.projectIndexer.design.hasOwnProperty("palette")) {
			var keys = Object.keys(this.projectIndexer.design.palette);
			enyo.forEach(keys, function(o) {
				if (this.projectIndexer.design.palette[o]) {
					var keys = Object.keys(this.projectIndexer.design.palette[o].items);
					enyo.forEach(keys, function(item) {
						var kindName = this.projectIndexer.design.palette[o].items[item].config.kind || "";
						catchKindListInPalette.push(kindName);
					}, this);
				}
			}, this);
		}
		// Get list of all public Components from indexer without palette meta-data, sorted by name
		var catchAllKinds = enyo.filter(this.projectIndexer.objects, function(o) {
			return  (o.type == "kind") && (enyo.indexOf("enyo.Component", o.superkinds) >= 0) &&
				(o.group == "public") && (catchKindListInPalette.indexOf(o.name) == -1);
		}).sort(function(a,b) {
			return a.name.localeCompare(b.name);
		});
		// Add components to catch-all categories per namespace
		enyo.forEach(catchAllKinds, function(kind) {
			// Create palette item for kind
			var item = {
				name: kind.name,
				description: kind.comment,
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
						order: 10000,
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
	},
	/** @private */
	paletteFiltering: function(inSender, inEvent) {
		this.trace(inSender, "=>", inEvent);
		
		if (this.$.filterPalette.getValue() === "") {
			this.$.filterPaletteIcon.set("src", "$deimos/images/search-input-search.png");
		} else {
			this.$.filterPaletteIcon.set("src", "$deimos/images/search-input-cancel.png");
		}
		this.projectIndexerChanged();

		return true;
	},
	/** @private */
	resetFilter: function(inSender, inEvent) {
		this.trace(inSender, "=>", inEvent);
		
		if (this.$.filterPalette.getValue() !== "") {
			this.$.filterPalette.setValue("");
			this.paletteFiltering();
		}

		return true;
	}
});
