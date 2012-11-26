enyo.kind({
	name: "Inspector",
	events: {
		onModify: "",
		onAction: ""
	},
	published: {
		filterLevel: null		// Value will be given by Inspector.Filters "checked" item.
	},
	components: [
		{kind: "Scroller", classes: "enyo-fit", fit: true, components: [
			{name: "content", kind: "FittableRows"}
		]}
	],
	handlers: {
		onChange: "change",
		onDblClick: "dblclick"
	},
	style: "padding: 8px; white-space: nowrap;",
	debug: false,
	create: function() {
		this.inherited(arguments);
	},
	allowed: function(inControl, inType, inName) {
		var level = Model.getFilterLevel(inControl.kind, inType, inName);
		this.debug && this.log("Level: " + level + " for " + inControl.kind + "." + inName);
		return level >= this.filterLevel;
	},
	buildPropList: function(inControl) {

		// TODO: property and event list must come from the Analyzer output.
		var domEvents = ["ontap", "onchange", "ondown", "onup", "ondragstart", "ondrag", "ondragfinish", "onenter", "onleave"]; // from dispatcher/guesture
		var propMap = {}, eventMap = {};
		var context = inControl;
		while (context) {
			for (var p in context.published) {
				if (this.allowed(inControl, "properties", p)) {
					// this.debug && this.log("Adding property '" + p + "' from '" + context.kind + "'");
					propMap[p] = true;
				}
			}
			for (var e in context.events) {
				if (this.allowed(inControl, "events", e)) {
					// this.debug && this.log("Adding event '" + e + "' from '" + context.kind + "'");
					eventMap[e] = true;
				}
			}
			context = context.base && context.base.prototype;
		}
		var props = [];
		var propKeys = Object.keys(propMap).sort();
		for (var n = 0; n < propKeys.length; n++) {
			props.push(propKeys[n]);
		}
		props.events = [];
		for (var n in eventMap) {
			props.events.push(n);
		}
		for (n=0; n < domEvents.length; n++) {
			if (this.allowed(inControl, "events", domEvents[n])) {
				props.events.push(domEvents[n]);
			}
		}
		return props;
	},
	makeEditor: function(inControl, inName, inType) {
		this.debug && this.log("Adding entry for " + inType + " " + inName);
		var info = Model.getInfo(inControl.kind, inType, inName);
		var kind = (info && info.inputKind);
		var v = inControl[inName];
		if (v === undefined) {
			v="";
		}

		// Select the good input kind
		if (kind && kind instanceof Object) {	// User defined kind: as an Object
			kind = enyo.clone(kind);
			kind = enyo.mixin(kind, {fieldName: inName, fieldValue: v, extra: inType});
			this.$.content.createComponent(kind);
		} else if (kind) {						// User defined kind: We assume it's a String
			this.$.content.createComponent({kind: kind, fieldName: inName, fieldValue: v, extra: inType});
		} else if (v === true || v === false) {
			this.$.content.createComponent({kind: "Inspector.Config.Boolean", fieldName: inName, fieldValue: v, extra: inType});
		} else {
			this.$.content.createComponent({kind: "Inspector.Config.Text", fieldName: inName, fieldValue: v, extra: inType});
		}
	},
	inspect: function(inControl) {
		this.$.content.destroyComponents();
		this.selected = inControl;
		if (inControl) {
			this.$.content.createComponent({tag: "h3", content: inControl.kindName, classes: "label label-info"});
			this.$.content.createComponent({classes: "onyx-groupbox-header", content: "Properties"});
			var ps = this.buildPropList(inControl);
			for (var i=0, p; p=ps[i]; i++) {
				this.makeEditor(inControl, p, "properties");
			}
			ps = ps.events;
			if (ps.length) {
				this.$.content.createComponent({classes: "onyx-groupbox-header", content: "Events"});
			}
			for (var i=0, p; p=ps[i]; i++) {
				this.makeEditor(inControl, p, "events");
			}
		}
		this.$.content.render();
	},
	change: function(inSender, inEvent) {
		var n = inEvent.target.fieldName;
		var v = inEvent.target.fieldValue;

		var num = parseFloat(v);
		if (String(num) == v) {
			v = num;
		}

		this.debug && this.log(n, v);
		this.selected.setProperty(n, v);
		this.doModify();
	},
	dblclick: function(inSender, inEvent) {
		if (inEvent.target.extra === "events") {
			//this.changeHandler(inSender, inEvent);
			var n = inEvent.target.fieldName;
			var v = inEvent.target.fieldValue;
			// FIXME: hack to supply a default event name
			if (!v) {
				v = inEvent.target.fieldName = this.selected.name + enyo.cap(n.slice(2));
				this.debug && this.log("SET handler: " + n + " --> " + v);
				this.selected.setProperty(n, v);
				this.change(inSender, inEvent);
				inEvent.target.setFieldValue(v);
			}
			this.doAction({value: v});
		}
	}
});

enyo.kind({
	name: "Inspector.Filters",
	events: {
		onLevelChanged: ""
	},
	components: [
		{kind: "Group", classes: "group", onActivate:"doLevelChanged", highlander: true, components: [
				{kind:"enyo.Checkbox", value: Model.F_USEFUL, content: "Frequently used", checked: true},
				{kind:"enyo.Checkbox", value: Model.F_NORMAL, content: "Normal"},
				{kind:"enyo.Checkbox", value: Model.F_DANGEROUS, content: "All"}
			]}
	]
});
