enyo.kind({
	name: "enyo.Panels",
	classes: "enyo-panels",
	published: {
		index: 0
	},
	handlers: {
		ondragstart: "dragStart",
		ondrag: "drag",
		ondragfinish: "dragFinish"
	},
	create: function() {
		this.transition = this.slide;
		//this.transition = this.snap;
		this.inherited(arguments);
	},
	initComponents: function() {
		this.createChrome([{kind: "Animator", onStep: "step"}]);
		this.inherited(arguments);
	},
	setIndex: function(inIndex) {
		// override setIndex so that indexChanged is called whether this.index has actually changed or not
		this.setPropertyValue("index", inIndex, "indexChanged");
	},
	indexChanged: function(inOld) {
		var c = this.controls[inOld];
		/*
		if (c) {
			c.applyStyle("border-color", null);
		}
		*/
		var c = this.controls[this.index];
		if (c) {
			//c.applyStyle("border-color", "orange");
			var x = {
				startValue: this.hasNode().scrollLeft,
				endValue: c.hasNode().offsetLeft, //this.index ? this.index * c.hasNode().offsetWidth : 0,
				//duration: 300 //Math.abs(inOld - this.index) * 250
				//duration: 150 + Math.abs(inOld - this.index - 1) * 75
			};
			this.transition(x);
		}
	},
	//
	slide: function(inX) {
		this.$.animator.play(inX);
	},
	step: function(inSender) {
		this.hasNode().scrollLeft = inSender.value;
	},
	//
	snap: function(inX) {
		this.hasNode().scrollLeft = inX.endValue;
	},
	//
	dragStart: function(inSender, inEvent) {
		if (inEvent.horizontal) {
			this.dragging = true;
			this.$.animator.stop();
			this.l = this.hasNode().scrollLeft;
		}
	},
	drag: function(inSender, inEvent) {
		if (this.dragging) {
			this.hasNode().scrollLeft = this.l - inEvent.dx;
		}
	},
	dragFinish: function(inSender, inEvent) {
		if (this.dragging) {
			this.dragging = false;
			inEvent.preventTap();
			//
			this.drag(inSender, inEvent);
			//this.log(this.index, inEvent.xDirection);
			var x = Math.max(0, Math.min(this.controls.length-1, this.index - inEvent.xDirection));
			this.setIndex(x);
		}
		//
		/*
		var l = this.hasNode().scrollLeft;
		var x = -1;
		for (var i=0; c=this.controls[i]; i++) {
			var b = c.getBounds();
			if (l > b.left && l < b.left + b.width) {
				x = l - b.left > b.width / 2 ? i + 1 : i;
				//this.log(l + "px is inside of control " + i + ", selected panel is " + x + " based on center " + b.width / 2);
				break;
			}
		}
		if (x >= 0) {
			x = Math.min(x, this.controls.length-1);
			if (x == this.index) {
				this.index = -1;
			}
			this.setIndex(x);
		}
		*/
	}
});
