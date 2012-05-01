enyo.kind({
	name: "enyo.Pane",
	style: "height: 100%;",
	published: {
		slideable: false
	},
	handlers: {
		ondrag: "checkDrag",
		ondragfinish: "checkDrag"
	},
	checkDrag: function(inSender, inEvent) {
		
		if (!this.slideable) {
			inEvent.preventDefault();
			return true;
		}
	}
});

enyo.kind({
	name: "enyo.SinglePanes",
	kind: enyo.Panels,
	defaultKind: enyo.Pane,
	published: {
		animate: false
	},
	indexChanged: function(inOld) {
		var c = this.controls[this.index];
		if (c) {
			var x = {
				startValue: this.hasNode().scrollLeft,
				endValue: c.hasNode().offsetLeft
			};
			if (!this.animate) {
				x.duration = 0;
			}
			this.transition(x);
		}
	},
	next: function() {
		this.setIndex(this.index + 1);
	},
	previous: function() {
		this.setIndex(this.index - 1);
	}
});