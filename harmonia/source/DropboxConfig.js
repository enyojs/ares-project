enyo.kind({
	name: "DropboxConfig",
	//kind: "Scroller",
	//maxHeight: "400px",
	classes: "enyo-unselectable",
	style: "min-width: 240px; margin: 4px; padding: 8px 16px 12px 16px; background-color: #eee; color: #555;",
	components: [
		{tag: "h3", content: "Dropbox Authorization"},
		{kind: "FieldDecorator", title: "Email", subtitle: "Dropbox login email", components: [
			{kind: "ToolDecorator", classes: "onyx-input-decorator", components: [
				{name: "emailInput", kind: "Input", placeholder: "Email", style: "width: 250px;"},
				{name: "emailValidIcon", kind: "Image"}
			]}
		]},
		//{classes: "invalid-field-hint", content: "Passwords do not match."}
		{kind: "FieldDecorator", title: "Password", subtitle: "Dropbox account password", components: [
			{kind: "ToolDecorator", classes: "onyx-input-decorator", components: [
				{name: "passwordInput", kind: "Input", placeholder: "Password", type: "password", style: "width: 250px;"},
				{name: "passwordValidIcon", kind: "Image"}
			]}
		]},
		{content: "<br/>", allowHtml: true},
		{kind: "FieldDecorator", title: "Authorization", subtitle: "Click Authorize button to enable access", style: "display: block;", components: [
			{kind: "ToolDecorator", classes: "onyx-input-decorator", components: [
				{name: "authInput", kind: "Input", placeholder: "Authorization Token", disabled: true, style: "width: 250px;"},
				{name: "authBusy", kind: "Image", src: "$harmonia/images/busy.gif", style: "visibility: hidden;"},
				{name: "authValidIcon", kind: "Image"}
			]},
			{kind: "onyx.Button", content: "Authorize", ontap: "authAction", style: "margin: 8px; vertical-align: middle;"}
		]},
		//{classes: "invalid-field-hint", content: "Must be between 8 and 10 characters, contain at least one digit and one alphabetic character."},
		{style: "text-align: right; margin-top: 8px;", components: [
			{name: "okButton", kind: "onyx.Button", disabled: true, content: "Ok", ontap: "okAction"},
			{kind: "onyx.Button", content: "Cancel", ontap: "cancelAction", style: "margin-left: 8px;"}
		]}
	],
	create: function() {
		this.inherited(arguments);
	},
	okAction: function() {
		this.bubble("onClose");
	},
	cancelAction: function() {
		this.bubble("onClose");
	},
	authAction: function() {
		this.$.authBusy.applyStyle("visibility", "visible");
		//
		var user = this.$.emailInput.getValue();
		var pass = this.$.passwordInput.getValue();
		//
		new enyo.Ajax({url: "http://184.169.139.5:8080/auth"})
			.go({user: user, password: pass})
			.response(this, function(inSender, inGoodies) {
				this.$.authBusy.applyStyle("visibility", "hidden");
				if (inGoodies.token) {
					this.auth = {
						token: inGoodies.token,
						secret: inGoodies.secret
					};
					this.$.authInput.setValue(this.auth.token);
					this.$.okButton.setDisabled(false);
					localStorage.setItem("dropbox", enyo.json.stringify(this.auth));
					this.bubble("onAuth");
				} else {
					alert("Error: \n" + enyo.json.stringify(inGoodies));
				}
			})
		;
	}
});

enyo.kind({
	name: "ProviderConfigPopup",
	kind: "onyx.Popup",
	published: {
	},
	events: {
	},
	handlers: {
		onClose: "closeAction"
	},
	closeAction: function() {
		this.hide();
		return true;
	}
});