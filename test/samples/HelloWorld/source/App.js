enyo.kind({
	name: "App",
	kind: "FittableRows",
	components: [
		{name: "hello", content: "Hello", ontap:"ontap"},
		{name: "world", content: "World!", ontap:"ontap"}
	],
	red: false,
	ontap: function() {
		if (this.red === true) {
			this.$.hello.applyStyle("background-color", "blue");
			this.red = false;
		} else {
			this.$.hello.applyStyle("background-color", "red");
			this.red = true;
		}
	}
});

enyo.kind({
	name: "Hello",
	kind: "FittableRows",
	components: [
		{name: "hello", content: "Hello, World!", ontap:"ontap"}
	]
});
