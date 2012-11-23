enyo.kind({
	name: "Inspector",
	events: {
		onModify: "",
		onAction: "",
		onMakeInput: ""
	},
	published: {
		filterLevel: null		// Value will be given by Inspector.Filters "checked" item.
	},
	components: [
		{kind: "Scroller", classes: "enyo-fit", fit: true, components: [
			{name: "client", allowHtml: true}
		]}
	],
	handlers: {
		onchange: "change",
		ondblclick: "dblclick"
	},
	style: "padding: 8px; white-space: nowrap;",
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
					this.debug && this.log("Adding property '" + p + "' from '" + context.kind + "'");
					propMap[p] = true;
				}
			}
			for (var e in context.events) {
				this.debug && this.log("Adding event '" + e + "' from '" + context.kind + "'");
				eventMap[e] = true;
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
			props.events.push(domEvents[n]);
		}
		return props;
	},
	makeEditor: function(inControl, inProperty, inExtra) {
		this.debug && this.log("Adding entry for '" + inProperty + "'");
		var h = [];
		h.push('<div class="inspector-field-caption">', inProperty, ":", '</div>');
		var v = inControl[inProperty];
		if (v === undefined) {
			v="";
		}
		var inputDiv = this.doMakeInput({property: inProperty, value: v, extra: inExtra});
		if (inputDiv) {
			h.push(inputDiv);
		} else if (v === true || v === false) {
			h.push('<input type="checkbox" class="inspector-field-checkbox" ', v ? ' checked="checked"' : '', ' name="' + inProperty + '"', inExtra || "", '/>');
		} else {
			h.push('<input class="inspector-field-editor" value="' + v + '" name="' + inProperty + '"', inExtra || "", '/>');
		}
		h.push("<br/>");
		return h.join('');
	},
	inspect: function(inControl) {
		var h = [];
		this.selected = inControl;
		if (inControl) {
			h.push("<h3>", inControl.name, ' <span class="label label-info">', inControl.kindName, "</span>", "</h3>");
			h.push("<div class=\"onyx-groupbox-header\">Properties</div>");
			var ps = this.buildPropList(inControl);
			for (var i=0, p; p=ps[i]; i++) {
				h.push(this.makeEditor(inControl, p));
			}
			ps = ps.events;
			if (ps.length) {
				h.push("<div class=\"onyx-groupbox-header\">Events</div>");
			}
			for (var i=0, p; p=ps[i]; i++) {
				h.push(this.makeEditor(inControl, p, " event=true "));
			}
		}
		this.$.client.setContent(h.join(''));
	},
	change: function(inSender, inEvent) {
		var n = inEvent.target.name;
		var v = inEvent.target.value;
		this.log(n, v);
		if (inEvent.target.type == "checkbox") {
			v = inEvent.target.checked;
		} else {
			var num = parseFloat(v);
			if (String(num) == v) {
				v = num;
			}
		}
		//this.log(n, v);
		this.selected.setProperty(n, v);
		this.doModify();
	},
	dblclick: function(inSender, inEvent) {
		if (inEvent.target.getAttribute("event")) {
			//this.changeHandler(inSender, inEvent);
			var n = inEvent.target.name;
			var v = inEvent.target.value;
			// FIXME: hack to supply a default event name
			if (!v) {
				v = inEvent.target.value = this.selected.name + enyo.cap(n.slice(2));
				this.selected.setProperty(n, v);
				this.change(inSender, inEvent);
			}
			this.log(n, v);
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