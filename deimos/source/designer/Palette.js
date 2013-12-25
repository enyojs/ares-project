/* global ares */
enyo.kind({
	name: "CategoryItem",
	/** @public */
	published: {
		//* When true, Drawer is shown as disabled and does not and not respond to tap
		disabled: false
	},
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
	events: {
		onToggledDrawer: ""
	},
	toggleDrawer: function() {
		if (!this.getDisabled()) {
			var open = this.$.drawer.getOpen();
			this.$.drawer.setOpen(!open);
			this.$.indicator.addRemoveClass("turned", !open);
			this.doToggledDrawer();
		}
	},
	setModel: function(inModel) {
		this.model = inModel;
		this.$.name.setContent(this.model.name);
		this.$.list.count = this.model.items.length;
		//* Set disabled if items list is empty
		this.setDisabled(!this.model.items.length);
		if (this.$.list.count === 0 && this.$.drawer.getOpen()) {
			this.openDrawer();
		}
		this.$.list.build();
		if (this.$.name.content === "ignore") {
			this.hide();
		}
	},
	setupItem: function(inSender, inEvent) {
		inEvent.item.$.paletteItem.setModel(this.model.items[inEvent.index]); // <---- TODO - sibling reference, should be fixed up
		return true;
	},
	/** @public */
	openDrawer: function() {
		if (!this.getDisabled()) {
			this.$.drawer.setOpen(true);
			this.$.indicator.addRemoveClass("turned", true);
		}
	},
	/** @public */
	closeDrawer: function() {
		this.$.drawer.setOpen(false);
		this.$.indicator.addRemoveClass("turned", false);
	},
	/** @public */
	drawerStatus: function() {
		return this.$.drawer.getOpen();
	},
	/** @private */
	disabledChanged: function(oldValue) {
		if (this.$.drawer.getOpen()) {
			this.closeDrawer();
		}
		this.applyStyle("opacity", this.disabled ? 0.5 : 1);
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
		ondragstart: "decorateDragEvent",
		onmousedown: "selectItem"
	},
	//* On dragstart, add _this.config_ data to drag event
	decorateDragEvent: function(inSender, inEvent) {
		if (!inEvent.dataTransfer) {
			return true;
		}
		inEvent.config = this.config;
		inEvent.options = this.options;
	},
	selectItem: function(inSender, inEvent) {
		//* Bubble after mousedown event
		this.bubbleUp("onSelectedItem", {item: this});
	},
	setModel: function(inModel) {
		if (inModel) {
			/* jshint ignore:start */
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
			/* jshint ignore:end */
			this.config = inModel.config;
			this.options = inModel.options;
		}
	}
});

enyo.kind({
	name: "Palette",
	style: "position: relative",
	published: {
		projectIndexer: "",
		//* True - if need highlighted
		highlighted: true,
		//* Active Item - which will be highlighted
		selectedComponent: null,
		//* If true - filtering state is active
		filteringState: false
	},
	debug: false,
	components: [
		{kind: "FittableRows", classes: "enyo-fit", components: [
			{kind: "onyx.MoreToolbar", classes: "deimos-toolbar deimos-toolbar-margined-buttons", components: [
				{kind: "onyx.Button", name: "expandAllCategoriesButton", content: "Expand all", ontap: "expandAllCategories"},
				{kind: "onyx.Button", name: "collapseAllCategoriesButton", content: "Collapse all", ontap: "collapseAllCategories"}
			]},
			{kind: "Scroller", fit: true, components: [
				{name: "list", kind: "Repeater", count: 0, onSetupItem: "setupItem", components: [
					{kind: "CategoryItem"}
				]}
			]},
			{kind: "onyx.InputDecorator", style: "width:100%; margin-top:10px;", layoutKind: "FittableColumnsLayout", components: [
				{kind: "onyx.Input", name: "filterPalette", fit:true, placeholder: "filter", oninput: "paletteFiltering"},
				{kind: "onyx.Icon", name: "filterPaletteIcon", src: "$deimos/images/search-input-search.png", style: "height:20px;", ontap: "resetFilter"}
			]}
		]}
	],
	handlers: {
		ondragstart: "dragstart",
		onToggledDrawer: "toggledDrawer",
		onSelectedItem: "selectedItem"
	},
	create: function () {
		ares.setupTraceLogger(this);
		this.inherited(arguments);
		this.$.expandAllCategoriesButton.setDisabled(true);
		this.$.collapseAllCategoriesButton.setDisabled(true);
	},
	rendered: function() {
		//* Сure the browsers cache
		window.setTimeout(enyo.bind(this, function() {
			// hack for enyo.Input (FF and some browsers) 
			this.$.filterPalette.setValue(' ');
			this.$.filterPalette.setValue('');
		}), 0);
	},
	setupItem: function(inSender, inEvent) {
		var index = inEvent.index;
		var item = inEvent.item;
		item.$.categoryItem.setModel(this.palette[index]);
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
		// List will be scroll to top or first not empty drawer
		this.scrollListTo(this.setFilteringState() ? 'first' : 'top');
		this.expandControlButtonsChange();
	},
	/**
	 * Provide correct scroll to first visible drawer
	 * @protected
	 */
	scrollListTo: function(position) {
		this.$.scroller.render();
		if (position === 'top') {
			this.$.scroller.setScrollTop(0);
		} else if (position === 'first') {
			var drawers = this.$.list.getControls(), foundFirst = null;
			for (var i = 0, cnt = drawers.length; i < cnt; ++i) {
				if (!drawers[i].$.categoryItem.getDisabled() && (drawers[i].$.categoryItem.$.name.content !== "ignore")) {
					foundFirst = drawers[i].$.categoryItem;
					break;
				}
			}
			if (foundFirst) {
				this.$.scroller.scrollToNode(foundFirst.hasNode());
			} else {
				this.$.scroller.setScrollTop(0);
			}
		}
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
			this.setFilteringState(false);
		} else {
			this.$.filterPaletteIcon.set("src", "$deimos/images/search-input-cancel.png");
			this.setFilteringState(true);
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
	},
	/** @private */
	expandAllCategories: function(inSender, inEvent) {
		this.trace(inSender, "=>", inEvent);

		for (var i = 0; i < this.$.list.count; i ++) {
			if (!this.$.list.getControls()[i].$.categoryItem.getDisabled()) {
				this.$.list.getControls()[i].$.categoryItem.openDrawer();
			}
		}
		this.expandControlButtonsChange();
		this.scrollListTo('top');
		return true;
	},
	/** @private */
	collapseAllCategories: function(inSender, inEvent) {
		this.trace(inSender, "=>", inEvent);

		this.setSelectedComponent(null); // Clear highlighted item
		for (var i = 0; i < this.$.list.count; i ++) {
			if (!this.$.list.getControls()[i].$.categoryItem.getDisabled()) {
				this.$.list.getControls()[i].$.categoryItem.closeDrawer();
			}
		}
		this.expandControlButtonsChange();
		this.scrollListTo('top');
		return true;
	},
	/** @private */
	toggledDrawer: function(inSender, inEvent) {
		this.trace(inSender, "=>", inEvent);

		var selectedItem = this.getSelectedComponent(),
			list = inEvent.originator.$.list.getComponents();

		//* Clear highlighted item if it exists 
		enyo.forEach(list, enyo.bind(this, function(item) {
			if (item.$.paletteItem === selectedItem) {
				this.setSelectedComponent(null);
				return false;
			}
		}));
		this.expandControlButtonsChange();
	},
	
	/**
	 * Enable/Disable exp.control buttons
	 * @protected
	 */
	expandControlButtonsChange: function () {
		var drawers = this.$.list.getControls(),
			openedDrawers = 0,
			closedDrawers = 0;
		// sum opened and closed drawers
		enyo.forEach(drawers, function(drawer) {
			if (!drawer.$.categoryItem.getDisabled() && (drawer.$.categoryItem.$.name.content !== "ignore")) {
				if (drawer.$.categoryItem.drawerStatus() === true) {
					openedDrawers++;
				} else {
					closedDrawers++;
				}
			}
		});
		// Enable/Disable exp.control buttons in accordance with 
		// opened and closed drawers
		if (openedDrawers === 0 && closedDrawers === 0) {
			this.$.expandAllCategoriesButton.setDisabled(true);
			this.$.collapseAllCategoriesButton.setDisabled(true);
		} else if (openedDrawers > 0 && closedDrawers > 0) {
			this.$.expandAllCategoriesButton.setDisabled(false);
			this.$.collapseAllCategoriesButton.setDisabled(false);
		} else if (openedDrawers > 0 && closedDrawers === 0) {
			this.$.expandAllCategoriesButton.setDisabled(true);
			this.$.collapseAllCategoriesButton.setDisabled(false);
		} else {
			this.$.expandAllCategoriesButton.setDisabled(false);
			this.$.collapseAllCategoriesButton.setDisabled(true);
		}
	},

	selectedItem: function(inSender, inEvent) {
		this.setSelectedComponent(inEvent.item);
		return true;
	},

	selectedComponentChanged: function(prevSelectedComponent) {
		if (this.highlighted) { // if needs highlighted
			if (prevSelectedComponent && prevSelectedComponent.$.control) {
				prevSelectedComponent.$.control.addRemoveClass("selected", false);
			}
			if (this.selectedComponent) {
				this.selectedComponent.$.control.addRemoveClass("selected", true);
			}
		}
	},

	filteringStateChanged: function() {
		if (this.filteringState) {
			this.expandControlButtonsChange();
		}
	}
});
