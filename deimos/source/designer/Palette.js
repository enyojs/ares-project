enyo.kind({
	name: "CategoryItem",
	components: [
		{style: " border-radius: 4px; border: 1px solid #D0D0D0; margin-bottom: 1px;", components: [
			{name: "name", style: "padding: 8px; background-color: #E1E2E4; color: #5CA7E8; text-transform: uppercase; font-weight: bold; font-size: 1.2em;"},
			{classes: "row-fluid", components: [
				{name: "list", kind: "Repeater", count: 0, onSetupItem: "setupItem", components: [
					{kind: "PaletteItem"}
				]}
			]}
		]}
	],
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
		{style: "background-color: #F5F5F5; border-radius: 4px; border-top: 1px solid #D0D0D0; padding: 12px;", components: [
			{tag: "h5", name: "name"},
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
			if (inModel.inline) {
				this.createComponent(inModel.inline);
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
			{classes: "well", components: [
				{kind: "Input", classes: "search-query", value: "filter"}
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
