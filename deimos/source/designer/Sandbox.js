enyo.kind({
	name: "Sandbox",
	classes: "deimos_panel_center",
	events: {
		onDesignRendered: ""
	},
	rendered: function() {
		this.doDesignRendered();
	}
});