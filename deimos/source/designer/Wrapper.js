enyo.kind({
	name: "Wrapper",
	kind: "Control",
	classes: "wrapper",
	events: {
	},
	published: {
		scrimZ: 100,
      doubleClickDelay: 0.5
	},
  previousTap: undefined,
	components: [
		{name: "scrim", kind: "onyx.Scrim", classes: "onyx-scrim-translucent", ontap: "tapped"}
	],
	create: function() {
		this.inherited(arguments);
	},
	render: function() {
		this.inherited(arguments);
	},
	rendered: function() {
		this.inherited(arguments);
		this.showScrim();
	},
	hideScrim: function(inSender, inEvent) {
		this.$.scrim.hideAtZIndex(this.scrimZ);
	},
	showScrim: function(inSender, inEvent) {
		this.$.scrim.setBounds(this.getBounds());
		this.$.scrim.showAtZIndex(this.scrimZ);
	},
    tapped: function(inSender, inEvent) {
      if (this.previousTap && (Date.now()-this.previousTap)/1000 < this.doubleClickDelay) {
        this.hideScrim();
      } else {
        this.previousTap=Date.now();
      }
    }
});
