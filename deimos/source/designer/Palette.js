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
			{classes: "row-fluid", name: "client"},
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
	create: function() {
		this.model = Palette.model;
		//
		this.inherited(arguments);
		//
		//this.categories = this.categorize();
		this.categories = this.model;
		//this.$.list.rows = this.model.length;
		this.$.list.count = this.categories.length;
		this.$.list.build();
	},
	categorize: function() {
		var map = {};
		for (var i=0, m, c; m=this.model[i]; i++) {
			if (!(c = map[m.category])) {
				c = map[m.category] = [];
			}
			c.push(m);
		}
		var list = [];
		for (c in map) {
			list.push({name: c, items: map[c]});
		}
		return list;
	},
	setupItem: function(inSender, inEvent) {
		var index=inEvent.index;
		var item = inEvent.item;
		item.$.categoryItem.setModel(this.categories[index]);
		return true;
	},
	dragstart: function(inSender, inEvent) {
		if(!inEvent.dataTransfer) {
			return false;
		}
		
		inEvent.dataTransfer.setData("Text", enyo.json.codify.to(enyo.mixin(inEvent.config, {op: "newControl"})));
        return true;
	}
});
