enyo.kind({
	name: "Serializer",
	kind: "Component",
	//* public
	serialize: function(inContainer, inOwner) {
		var s = this._serialize(inContainer, inOwner);
		return enyo.json.codify.to(s, null, 4);
	},
	//* public
	getComponents: function(inContainer, inOwner) {
		return this._serialize(inContainer, inOwner);
	},
	//* protected
	_serialize: function(inContainer, inOwner) {
		var s = [];
		var c$ = inContainer.getClientControls();
		for (var i=0, c; c=c$[i]; i++) {
			if (c.owner == inOwner) {
				s.push(this._serializeComponent(c, inOwner));
			}
		}
		return s;
	},
	//* public
	serializeComponent: function(inComponent, inOwner) {
		var s = this._serializeComponent(inComponent, inOwner);
		return enyo.json.codify.to(s, null, 4);
	},
	//* protected
	_serializeComponent: function(inComponent, inOwner) {
		var p = this.serializeProps(inComponent);
		if (inComponent instanceof enyo.Control) {
			var cs = this._serialize(inComponent, inOwner);
			if (cs && cs.length) {
				p.components = cs;
			}
		}
		this.serializeEvents(p, inComponent);
		return p;
	},
	noserialize: {owner: 1, container: 1, parent: 1, id: 1, attributes: 1, selected: 1},
	serializeProps: function(inComponent) {
		var o = {
			kind: this.getComponentKindName(inComponent)
		};
		var ps = this.buildPropList(inComponent, "published");
		var proto = inComponent.ctor.prototype;
		for (var j=0, p; p=ps[j]; j++) {
			if (!this.noserialize[p] && proto[p] != inComponent[p]) {
				o[p] = inComponent[p];
			}
		}
		return o;
	},
	getComponentKindName: function(inComponent) {
		var k = inComponent.kindName.split(".");
		if (k[0] == "enyo") {
			k.shift();
		}
		return k.join(".");
	},
	serializeEvents: function(inProps, inComponent) {
		var ps = this.buildPropList(inComponent, "events");
		var proto = inComponent.ctor.prototype;
		for (var j=0, p; p=ps[j]; j++) {
			if (!this.noserialize[p] && proto[p] != inComponent[p]) {
				inProps[p] = inComponent[p];
			}
		}
		// this catches any event handlers added that aren't in the "events" list (e.g. DOM events)
		for (p in inComponent) {
			if (inComponent.hasOwnProperty(p) && p.substring(0,2) == "on") {
				inProps[p] = inComponent[p];
			}
		}
		return inProps;
	},
	buildPropList: function(inControl, inSource) {
		var map = {};
		var context = inControl;
		while (context) {
			for (var i in context[inSource]) {
				map[i] = true;
			}
			context = context.base && context.base.prototype;
		}
		var props = [];
		for (var n in map) {
			props.push(n);
		}
		return props;
	}
});
