enyo.kind({
	name: "Designer",
	events: {
		onSelect: "",
		onChange: ""
	},
	components: [
		{name: "model", kind: "Component"},
		{kind: "Serializer"},
		{name: "selectionOutline", kind: "DesignerOutline", style: "border: 5px dotted rgba(255, 146, 38, 0.7);"},
		{name: "containerOutline", kind: "DesignerOutline", style: "border: 5px solid rgba(24, 24, 255, 0.3);"},
		{kind: "FittableRows", classes: "deimos_panel_center  enyo-fit", components: [
			{style:"text-align:center;", components: [
				//{kind: "Button", content: "Undo"},
				//{kind: "Button", content: "Redo"},
				{kind: "onyx.Button", content: "Up", ontap: "upAction"},
				{kind: "onyx.Button", content: "Down", ontap: "downAction"},
				{kind: "onyx.Button", content: "Delete", classes: "btn-danger",  ontap: "deleteAction"},
			]},
			{name: "client", fit: true, kind: "DesignerPanel"}
		]}
	],
	style: "outline: none; position: relative;",
	attributes: {
		tabindex: 0
	},
	handlers: {
		onkeyup: "keyup",
		ondragstart: "dragStart",
		ondragover: "dragOver",
		ondrop: "drop"
	},
	serialize: function() {
		return this.$.serializer.serialize(this.$.client, this.$.model);
	},
	getComponents: function() {
		return this.$.serializer.getComponents(this.$.client, this.$.model);
	},
	previewDomEvent: function(e) {
		if (e.type == "down" && (e.dispatchTarget != this.$.outline) && e.dispatchTarget.isDescendantOf(this.$.client)) {
			this.trySelect(e.dispatchTarget instanceof enyo.Control ? e.dispatchTarget : null);
		}
	},
	keyup: function(inSender, inEvent) {
		var ESC = 27;
		if (inEvent.keyCode == ESC) {
			this.selectContainer();
		}
	},
	hideSelection: function() {
		this.$.selectionOutline.outlineControl(null);
		this.$.containerOutline.outlineControl(null);
	},
	trySelect: function(inControl) {
		var c = inControl;
		while (c && (c.owner != this.$.model)) {
			c = c.parent;
		}
		this.select(c);
		this.doSelect();
	},
	selectContainer: function() {
		if (this.selection) {
			this.trySelect(this.selection.container);
		}
	},
	getSelectedContainer: function() {
		var s = this.selection;
		// Remove container adjustment for now; makes designer much more usable
		//if (s && !s.isContainer) {
		//	s = s.container;
		//}
		return s;
	},
	select: function(inControl) {
		if (inControl && (inControl == this || !inControl.isDescendantOf(this.$.client))) {
			inControl = null;
		}
		this.selection = inControl;
		this.$.selectionOutline.outlineControl(this.selection);
		this.$.containerOutline.outlineControl(this.getSelectedContainer());
	},
	refresh: function() {
		this.select(this.selection);
		this.$.client.resized();
	},
	load: function(inDocument) {
		this.proxyArray(inDocument);
		this.hideSelection();
		this.$.model.destroyComponents();
		this.$.client.createComponents(inDocument, {owner: this.$.model});
		this.render();
		this.resized();
		this.doChange();
		var c = this.$.client.children[0];
		if (c) {
			this.trySelect(c);
		}
	},
	save: function() {
		this.unProxyUnknownKinds(this.$.client);
		return this.$.serializer.serialize(this.$.client, this.$.model);
	},
	deleteAction: function() {
		if (this.selection) {
			this.selection.destroy();
			this.refresh();
			this.doChange();
		}
	},
	dragStart: function(inSender, inEvent) {
		inEvent.dragInfo = this.selection;
	},
	dragOver: function(inSender, inEvent) {
		if (inEvent.dragInfo) {
			this.trySelect(inEvent.dispatchTarget);
		}
	},
	drop: function(inSender, inEvent) {
		var i = inEvent.dragInfo;
		if (i) {
			enyo.asyncMethod(this, "_drop", i);
			return true;
		}
	},
	_drop: function(inInfo) {
		if (inInfo instanceof enyo.Component) {
			this.dropComponentAction(inInfo);
		} else {
			this.createComponentAction(inInfo);
		}
		this.doChange();
	},
	dropComponentAction: function(inComponent) {
		var c = this.getSelectedContainer();
		if (c && !c.isDescendantOf(inComponent)) { // don't allow dropping onto yourself, or your children
			var props = this.$.serializer._serializeComponent(inComponent, this.$.model);
			this.log(props);
			enyo.asyncMethod(this, function() {
				inComponent.destroy();
				this.createComponentAction(props);
			});
			return true;
		}
		return false;
	},
	createComponentAction: function(inProps) {
		var c = this.getSelectedContainer();
		if ( ! c) {
			// There is no object already created
			c = this.$.client;
		}

		// The selection objects are moved around in the DOM and the nodes can lose sync with the enyo node
		// cache. Hiding the selection causes the selection nodes to be normalized, preventing any weirdness
		// when rendering new Controls.
		this.hideSelection();
		//
		// create the components
		var b = c.createComponent(inProps, {owner: this.$.model});
		//
		// FIXME: hack name insertion
		if (inProps.content == "$name") {
			b.setContent(b.name);
		}
		// FIXME: hack control insertion
		var p = this.selection && this.selection.parent;
		if (p && p == b.parent) {
			var i = p.children.indexOf(this.selection);
			if (i >= 0) {
				this.moveControl(b, i + 1);
			}
		}
		this.$.client.render();
		this.$.client.resized();
		//
		//this.modify();
		this.select(b);
	},
	moveControl: function(inControl, inIndex) {
		var move = function(inControl, inIndex, inList) {
			enyo.remove(inControl, inList);
			inList.splice(inIndex, 0, inControl);
		};
		// assumes that inControl.container.controls and inControl.parent.children are the same
		// which is not true in general
		move(inControl, inIndex, inControl.parent.children);
		move(inControl, inIndex, inControl.container.controls);
		this.$.client.resized();
	},
	nudgeControl: function(inControl, inDelta) {
		if (inControl) {
			var c = inControl.container;
			var i = c.indexOfControl(inControl);
			this.moveControl(inControl, i + inDelta);
			var p = inControl.parent;
			p.render();
			//this.modify();
			this.select(inControl);
			this.doChange();
		}
	},
	upAction: function(inSender) {
		this.nudgeControl(this.selection, -1);
	},
	downAction: function(inSender) {
		this.nudgeControl(this.selection, 1);
	},
	proxyArray: function(block) {
	    var i;
	    for (i=0; i < block.length; i++) {
	        block[i]=this.proxyUnknownKinds(block[i]);
	    }
        return block;
	},
	proxyUnknownKinds: function(component) {
		var name = component.kind;
		if (!enyo.constructorForKind(name)) {
			component.kind = "Proxy";
			component.realKind = name;
			if (component.name) {
				component.hadName=true;
			}
		}
		var children = component.components;
		if (children) {
			var i;
			for (i=0; i< children.length; i++) {
				children[i] = this.proxyUnknownKinds(children[i]);
			}
		}
		return component;
	},
	unProxyArray: function(block) {
	    var i;
	    for (i=0; i < block.length; i++) {
	        block[i]=this.unProxyUnknownKinds(block[i]);
	    }
        return block;
	},
	unProxyUnknownKinds: function(component) {
		if (component.realKind) {
			component.kindName = component.realKind;
			component.kind = component.realKind;
			delete component.realKind;
			if (!component.hadName) {
				delete component.name;
			}
		}
		delete component.hadName;
		var children = component.children;
		if (children) {
			var i;
			for (i=0; i< children.length; i++) {
				children[i] = this.unProxyUnknownKinds(children[i]);
			}
		}
		return component;
	}
});

enyo.kind({
	name: "DesignerOutline",
	style: "pointer-events: none; position: absolute;",
	showing: false,
	create: function() {
		this.inherited(arguments);
	},
	outlineControl: function(inControl) {
		if (inControl) {
			if (inControl.hasNode() && this.hasNode()) {
				// NOTE: reparenting outline node, requires care with rendering sequences
				inControl.node.parentNode.appendChild(this.node);
			}
			var b = inControl.getBounds();
			this.setBounds({left: b.left, top: b.top, width: b.width - 10, height: b.height - 10});
			this.show();
		} else {
			this.removeNodeFromDom();
			this.hide();
		}
	}
});

enyo.kind({
	name: "DesignerPanel",
	classes: "deimos_panel_center",
	events: {
		onDesignRendered: ""
	},
	rendered: function() {
		this.doDesignRendered();
	}
});
enyo.kind({
    name: "Proxy",
    content: "Proxy",
	published: {
		realKind: "",
		hadName: false
	},
	create: function() {
		this.inherited(arguments);
	},
	//* @protected
	// override this, and save imported properties
	importProps: function(inProps) {
		var ignoreProp = {container: true, owner: true};
		this.inherited(arguments);
		if (inProps) {
			for (var n in inProps) {
				if (!ignoreProp[n]) {
					if (n != "published") {
					this.published[n] = inProps[n];
					}
				}
			}
		}
	},
});
