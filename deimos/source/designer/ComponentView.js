enyo.kind({
	name: "ComponentView",
	events: {
		onSelect: "",
		onDragStart: ""
	},
	style: "position: relative;",
	components: [
		{kind: "Scroller", classes: "enyo-fit", components: [
			{name: "client", style: "padding: 8px;"}
		]}
	],
	indent: 32,
	visualize: function(inContainer, inOwner) {
		this.map = {};
		this.destroyClientControls();
		//this.createEntry(inContainer, 0);
		this._visualize(inContainer, inOwner, 0); //this.indent);
		this.render();
	},
	createEntry: function(inComponent, inIndent) {
		var kindName = inComponent.kindName === 'Ares.Proxy' ? inComponent.realKind : inComponent.kindName;
		this.map[inComponent.name] = this.createComponent(
			{comp: inComponent, style: "padding-left: " + inIndent + "px;", ontap: "itemSelect", ondragover: "itemDragOver", ondragstart: "itemDragStart", components: [
				{tag: "b", content: inComponent.name},
				{tag: "span", allowHtml: true, content: "&nbsp;(<i>" + kindName + "</i>)"}
			]}
		);
	},
	_visualize: function(inContainer, inOwner, inIndent) {
		var c$ = inContainer.getClientControls();
		for (var i=0, c; (c=c$[i]); i++) {
			if (c.owner == inOwner) {
				this.createEntry(c, inIndent);
			}
			if (c instanceof enyo.Control) {
				this._visualize(c, inOwner, inIndent + this.indent);
			}
		}
	},
	itemSelect: function(inSender) {
		this.select(inSender.comp);
		this.doSelect({component: inSender.comp});
	},
	select: function(inComponent) {
		if (this.selection) {
			this.applyMappedColor(this.selection.name, null);
		}
		this.selection = inComponent;
		if (this.selection) {
			this.applyMappedColor(this.selection.name, "orange");
		}
	},
	applyMappedColor: function(inKey, inColor) {
		var c = this.map[inKey];
		if (c) {
			c.applyStyle("background-color", inColor);
			this.$.scroller.scrollToControl(c);
		}
	},
	itemDragStart: function(inSender, inEvent) {
		inEvent.dragInfo = inSender.comp;
	},
	itemDragOver: function(inSender, inEvent) {
		if (inEvent.dragInfo) {
			this.itemSelect(inSender);
		}
	}
});
