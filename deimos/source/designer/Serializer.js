enyo.kind({
	name: "Serializer",
	kind: "Component",
	//* public
	serialize: function(inContainer) {
		var s = this._serialize(inContainer);
		return enyo.json.codify.to(s, null, 4);
	},
	getComponents: function(inContainer) {
		return this._serialize(inContainer);
	},
	serializeComponent: function(inComponent) {
		var s = this._serializeComponent(inComponent);
		return enyo.json.codify.to(s, null, 4);
	},
	//* protected
	_serialize: function(inContainer) {
		var s = [],
			c$ = this.getAresComponents(inContainer);
		
		for (var i=0, c; (c=c$[i]); i++) {
			s.push(this._serializeComponent(c));
		}
		
		return s;
	},
	getAresComponents: function(inContainer) {
		var a = [],
			c$  = inContainer.controls;
		
		for(var i=0, c;(c=c$[i]);i++) {
			if(c.aresComponent == "true") {
				a.push(c);
			}
		}
		
		return a;
	},
	_serializeComponent: function(inComponent) {
		var p = this.serializeProps(inComponent);
		if (inComponent instanceof enyo.Control) {
			var cs = this._serialize(inComponent);
			if (cs && cs.length) {
				p.components = cs;
			}
		}
		this.serializeEvents(p, inComponent);
		return p;
	},
	noserialize: {owner: 1, container: 1, parent: 1, id: 0, attributes: 1, selected: 1, active: 1, isContainer: 1},
	serializeProps: function(inComponent) {
		var o = {
			kind: this.getComponentKindName(inComponent)
		};
		var ps = this.buildPropList(inComponent, "published");
		var proto = inComponent.ctor.prototype;
		for (var j=0, p; (p=ps[j]); j++) {
			if (!this.noserialize[p] && proto[p] != inComponent[p] && inComponent[p] !== "") {
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
		for (var j=0, p; (p=ps[j]); j++) {
			if (!this.noserialize[p] && proto[p] != inComponent[p] && inComponent[p] !== "") {
				inProps[p] = inComponent[p];
			}
		}
		// this catches any event handlers added that aren't in the "events" list (e.g. DOM events)
		for (p in inComponent) {
			if (inComponent.hasOwnProperty(p) && p.substring(0,2) == "on" && inComponent[p] !== "") {
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
