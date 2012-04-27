enyo.kind({
	name: "enyo.Node",
	published: {
		//* @public
		expandable: false,
		expanded: false,
		icon: "",
		//* @protected
		//level: 0,
		selected: false
	},
	style: "padding: 0 0 0 16px;",
	content: "Node",
	defaultKind: "Node",
	classes: "enyo-node",
	components: [
		{name: "icon", kind: "Image", showing: false},
		{kind: "Control", name: "caption", Xtag: "span", style: "display: inline-block; padding: 4px;", allowHtml: true},
		{kind: "Control", name: "extra", tag: 'span', allowHtml: true}
	],
	childClient: [
		{kind: "Control", name: "box", classes: "enyo-node-box", Xstyle: "border: 1px solid orange;", components: [
			{kind: "Control", name: "client", classes: "enyo-node-client", Xstyle: "border: 1px solid lightblue;"}
		]}
	],
	events: {
		onNodeTap: "nodeTap",
		onNodeDblClick: "nodeDblClick",
		onExpand: "nodeExpand",
		onDestroyed: "nodeDestroyed"
	},
	handlers: {
		ondblclick: "dblclick"
	},
	//
	//* @protected
	create: function() {
		this.inherited(arguments);
		//this.expandedChanged();
		//this.levelChanged();
		this.selectedChanged();
		this.iconChanged();
	},
	destroy: function() {
		this.doDestroyed();
		this.inherited(arguments);
	},
	initComponents: function() {
		// TODO: optimize to create the childClient on demand
		//this.hasChildren = this.components;
		if (this.expandable) {
			this.kindComponents = this.kindComponents.concat(this.childClient);
		}
		this.inherited(arguments);
	},
	//
	contentChanged: function() {
		//this.$.caption.setContent((this.expandable ? (this.expanded ? "-" : "+") : "") + this.content);
		this.$.caption.setContent(this.content);
	},
	iconChanged: function() {
		this.$.icon.setSrc(this.icon);
		this.$.icon.setShowing(Boolean(this.icon));
	},
	selectedChanged: function() {
		this.addRemoveClass("enyo-selected", this.selected);
	},
	rendered: function() {
		this.inherited(arguments);
		if (this.expandable && !this.expanded) {
			this.quickCollapse();
		}
	},
	//
	addNodes: function(inNodes) {
		this.destroyClientControls();
		for (var i=0, n; n=inNodes[i]; i++) {
			this.createComponent(n);
		}
		this.$.client.render();
	},
	addTextNodes: function(inNodes) {
		this.destroyClientControls();
		for (var i=0, n; n=inNodes[i]; i++) {
			this.createComponent({content: n});
		}
		this.$.client.render();
	},
	//
	tap: function(inSender, inEvent) {
		this.toggleExpanded();
		this.doNodeTap();
		return true;
	},
	dblclick: function(inSender, inEvent) {
		this.doNodeDblClick();
		return true;
	},
	//
	toggleExpanded: function() {
		this.setExpanded(!this.expanded);
	},
	quickCollapse: function() {
		this.removeClass("enyo-animate");
		this.$.box.applyStyle("height", "0");
		var h = this.$.client.getBounds().height;
		this.$.client.setBounds({top: -h});
	},
	_expand: function() {
		this.addClass("enyo-animate");
		var h = this.$.client.getBounds().height;
		this.$.box.setBounds({height: h});
		this.$.client.setBounds({top: 0});
		setTimeout(enyo.bind(this, function() {
			// things may have happened in the interim, make sure
			// we only fix height if we are still expanded
			if (this.expanded) {
				this.removeClass("enyo-animate");
				this.$.box.applyStyle("height", "auto");
			}
		}), 225);
	},
	_collapse: function() {
		// disable transitions
		this.removeClass("enyo-animate");
		// fix the height of our box (rather than 'auto'), this
		// gives webkit something to lerp from
		var h = this.$.client.getBounds().height;
		this.$.box.setBounds({height: h});
		// yield the thead so DOM can make those changes (without transitions)
		setTimeout(enyo.bind(this, function() {
			// enable transitions
			this.addClass("enyo-animate");
			// shrink our box to 0
			this.$.box.applyStyle("height", "0");
			// slide the contents up
			this.$.client.setBounds({top: -h});
		}), 0);
	},
	expandedChanged: function(inOldExpanded) {
		if (!this.expandable) {
			this.expanded = false;
		} else {
			var event = {expanded: this.expanded};
			this.doExpand(event);
			if (!event.wait) {
				this.effectExpanded();
			}
		}
	},
	effectExpanded: function() {
		if (this.$.client) {
			if (!this.expanded) {
				this._collapse();
			} else {
				this._expand();
			}
		}
		//this.contentChanged();
	}/*,
	//
	//
	levelChanged: function() {
		this.applyStyle("padding-left", 16 + "px");
	},
	toggleChildren: function() {
		if (this.$.list) {
			this.$.list.setShowing(this.expanded);
		}
	},
	renderNodes: function(inNodes) {
		var list = this.createComponent({name: "list", container: this});
		for (var i=0, n; n=inNodes[i]; i++) {
			n.setLevel(this.level + 1);
			n.setContainer(list);
			n.render();
		}
		list.render();
	},
	//* @public
	addNodes: function(inNodes) {
		this.renderNodes(inNodes);
		this.toggleChildren();
	},
	removeNodes: function() {
		if (this.$.list) {
			this.$.list.destroy();
		}
	},
	hasVisibleChildren: function() {
		return this.expanded && this.$.list && this.$.list.controls.length > 0;
	},
	fetchParent: function() {
		return this.level > 0 && this.container.container;
	},
	fetchChildren: function() {
		return this.$.list && this.$.list.controls;
	},
	fetchFirstChild: function() {
		return this.$.list && this.$.list.controls[0];
	},
	fetchLastChild: function() {
		return this.$.list && this.$.list.controls[this.$.list.controls.length-1];
	},
	fetchPrevSibling: function() {
		var i = this.container.controls.indexOf(this);
		return this.level > 0 && this.container.controls[i-1];
	},
	fetchNextSibling: function() {
		var i = this.container.controls.indexOf(this);
		return this.level > 0 && this.container.controls[i+1];
	},
	getVisibleBounds: function() {
		return this.$.client.getBounds();
	}
	*/
});