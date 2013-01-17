enyo.kind({
	name: "Sandbox",
	classes: "deimos_panel_center",
	events: {
		onDesignRendered: ""
	},
	rendered: function() {
		this.inherited(arguments);
		this.doDesignRendered();
	},
	createComponents: function(components, extraProperties) {
		this.inherited(arguments);
	},
	load: function(inDocument, inOwner) {
		//this.wrapChildren(inDocument);
		this.createComponents([inDocument], {owner: inOwner});
	},
	wrapChildren: function(parent) {
		var components=[];
		for (var i=0; i < parent.components.length; i++) {
			var child = parent.components[i];
			components.push({
					kind: "Wrapper",
					components: [
						child
					]
			});
		}
		parent.components=components;
	}
});
