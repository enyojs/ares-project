enyo.kind({
	name: "Inspector",
	events: {
		onModify: "",
		onAction: "",
		onMakeInput: ""
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
	noinspect: {owner: 1, container: 1, parent: 1, prepend: 1, events: 1, id: 1},
	buildPropList: function(inControl) {
		var domEvents = ["ontap", "onchange", "ondown", "onup", "ondragstart", "ondrag", "ondragfinish", "onenter", "onleave"]; // from dispatcher/guesture
		var propMap = {}, eventMap = {};
		var context = inControl;
		while (context) {
			for (var p in context.published) {
				propMap[p] = true;
			}
			for (var e in context.events) {
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
				if (!this.noinspect[p]) {
					h.push(this.makeEditor(inControl, p));
				}
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