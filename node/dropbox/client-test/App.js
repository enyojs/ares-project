enyo.kind({
	name: "App",
	components: [
		{kind: "Button", content: "Authorize", ontap: "authAction"},
		{name: "listInput", kind: "Input", value: "public"},
		{name: "listButton", kind: "Button", content: "List", ontap: "listAction", disabled: true},
		{name: "output", allowHtml: true}
	],
	create: function() {
		this.inherited(arguments);
	},
	authAction: function() {
		this.$.output.addContent("Requesting tokens...<br/>");
		new enyo.Ajax({url: "http://localhost:3000/auth"})
			.go({user: "nouser", password: "nopassword"})
			.response(this, function(inSender, inGoodies) {
				if (inGoodies.token) {
					this.auth_token = inGoodies.token;
					this.auth_secret = inGoodies.secret;
					this.$.output.addContent(enyo.json.stringify(inGoodies) + "<hr/>");
					this.$.listButton.setDisabled(false);
				} else {
					this.$.output.addContent(enyo.json.stringify(inGoodies) + "<hr/>");
				}
			})
			;
	},
	listAction: function() {
		this.$.output.addContent("Requesting list...[" + this.$.listInput.getValue() + "]<br/>");
		new enyo.Ajax({url: "http://localhost:3000/list/" + this.$.listInput.getValue()})
			.go({token: this.auth_token, secret: this.auth_secret})
			.response(this, function(inSender, inGoodies) {
				this.$.output.addContent(enyo.json.stringify(inGoodies) + "<hr/>");
			})
			;
	}
});
