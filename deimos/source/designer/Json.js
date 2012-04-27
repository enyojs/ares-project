enyo.json.codify = {
	_block: function(p, inDent) {
		p = p.join(",\n");
		var j = (p ? "\n" + p + "\n" + inDent : "");
		return j;
	},
	obj: function(inObj, inDent) {
		var p = [], pp, v;
		for (var n in inObj) {
			v = inObj[n];
			if (n == "isa") {
				v = v.prototype.declaredClass;
			} else {
				v = this.value(v, inDent + "\t");
			}
			//pp = inDent + "\t" + n + ': ' + v;
			pp = n + ': ' + v;
			p.push(pp);
		}
		//return "{" + this._block(p, inDent) + "}";
		return "{" + p.join(", ") + "}";
	},
	array: function(inObj, inDent) {
		var p = [], pp;
		for (var i=0, v; v=inObj[i]; i++) {
			pp = inDent + "\t" + this.value(v, inDent + "\t");
			p.push(pp);
		}
		return "[" + this._block(p, inDent) + "]";
	},
	value: function(v, inDent) {
		var t = (v === null || v === undefined) ? "" : typeof v;
		switch (t) {
			case "string":
				v = v.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\"/g, "\\\"");
				return '"' + v + '"';
			case "function":
				// stringify the function body 
				// FIXME: browser incompatibilities. Instead, we probably should cache the method block
				// in string form and never interpret it.
				var lines = v.toString();
				// turn "\r" or "\n\r" into "\n"
				lines = lines.replace(/\n*\r/g, "\n");
				// FIXME: webkit doesn't seem to support \t in textarea
				// TODO: finalize editor. Assuming we aren't using textarea, above doesn't matter.
				// replace leading spaces with tabs, 4 spaces to a tab
				lines = lines.replace(/(^\.\.\.\.)|[\.\t]+(\.\.\.\.)/g, "\t");
				// replace 4-space tabs with 2-space tabs
				//lines = lines.replace(/(^\.\.\.\.)|[\.\t]+(\.\.)/g, "\t");
				// divide on newlines
				lines = lines.split("\n");
				// add indent, combine with newlines
				return lines.join("\n" + inDent);
			case "object":
				return (v.constructor == Array) ? this.array(v, inDent) : this.obj(v, inDent);
			default: 
				return v;
		}
	},
	to: function(inValue) {
		return this.value(inValue, "");
	},
	from: function(inJson) {
		return eval('(' + inJson + ')');
	}
};