enyo.kind({
	name: "CategoryItem",
	components: [
		{classes: "palette-category", components: [
			{ontap:"toggleDrawer", classes: "palette-category-name", components: [
				{name: "indicator", tag:"span", content:"v", style:"padding-right:5px;"},
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
		this.$.indicator.setContent(open ? ">" : "v");
	},
	setModel: function(inModel) {
		this.model = inModel;
		this.$.name.setContent(this.model.name);
		this.$.list.count = this.model.items.length;
		this.$.list.build();
	},
	setupItem: function(inSender, inEvent) {
		inEvent.item.$.paletteItem.setModel(this.model.items[inEvent.index]);
		return true;
	}
});

enyo.kind({
	name: "PaletteItem",
	components: [
		{classes: "palette-item", components: [
			{name: "name"},
			{classes: "row-fluid", name: "client"}
		]}
	],
	setModel: function(inModel) {
		if (inModel) {
			for (var n in inModel) {
				var c = this.$[n];
				if (c) {
					var v = inModel[n];
					if (c.tag == "img") {
						c.setSrc("images/" + v);
					} else {
						c.setContent(v);
					}
				}
			}
			// Avoiding this for a cleaner look for now, will likely revisit
			//if (inModel.inline) {
			//	this.createComponent(inModel.inline);
			//}
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
				{kind: "onyx.Icon", src:"images/search.png", style:"height:20px;"}
			]}
		]}
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
		var o = inEvent.originator;
		while (o && o != this) {
			if (o instanceof PaletteItem) {
				inEvent.dragInfo = o.config;
				return true;
			}
			o = o.parent;
		}
	}
});
