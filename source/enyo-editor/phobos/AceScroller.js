enyo.kind({
	name: "enyo.AceScroller",
	kind: enyo.Scroller,
	events: {
		onCalcBoundaries: ""
	},
	calcBoundaries: function() {
		if (this.hasNode()) {
			var bounds = {
					bottom: Math.min(0, this.node.clientHeight),
					right: Math.min(0, this.node.clientWidth)
				};
			this.doCalcBoundaries(bounds);
			this.$.scroll.bottomBoundary = bounds.bottom || 0;
			this.$.scroll.rightBoundary = bounds.right || 0;
		}
	},
	effectScrollAccelerated: function() {
	},
	effectScrollNonAccelerated: function() {
	}
});