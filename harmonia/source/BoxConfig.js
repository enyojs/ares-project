
// var Api = "uxr6ab2ge57318sm3mgbv5e0ntmji52k";
 enyo.kind({
	name: "Box",
	events: {
		onServerChange: "",
	},
	classes: "enyo-unselectable",
	style: "min-width: 240px; margin: 4px; padding: 8px 16px 12px 16px; background-color: #eee; color: #555;",components: [
		{name: "TokenButton", kind: "Button", content: "Authorize Ares", ontap: "tokenAction", disabled: true},
		{name: "output", allowHtml: true},
		{name: "tree", kind: "Scroller", fit: true,	components: [
			{kind: "Node", classes: "enyo-unselectable", showing: true, file: {id: ".",name: "server",isServer: true},
			content: "server",
			//icon: "source/lib/service/images/antenna.png",
			expandable: true,
			expanded: true,
			onExpand: "nodeExpand",
			onNodeTap: "nodeTap"
			},
			{content: " Box Files:"},
		]},
	],
	create: function() {
		this.inherited(arguments);
		this.apikey = "uxr6ab2ge57318sm3mgbv5e0ntmji52k";  //obtain from Box Platform Developers Page
		this.authAction();
	},

	authAction: function() {
		var request = new enyo.Ajax({
		url: "https://www.box.com/api/1.0/rest?action=get_ticket&api_key=" + this.apikey,
		handleAs: "xml"
		})

		request.response(this, function(inSender, inGoodies) {
		xmlDoc = inGoodies.childNodes[0].childNodes[1].textContent;

		if (xmlDoc) {
			this.auth_token = xmlDoc;
			console.log(this.auth_token);
			auth_token = (this.auth_token);
			this.listAction();
			} else {
				this.$.output.addContent("failed" + inGoodies);
			}
		});
		request.go(/*{user: "user", password: "password"}*/);
	},

	listAction: function() {
		window.open("https://www.box.com/api/1.0/auth/" + this.auth_token);
		this.$.TokenButton.setDisabled(false);

		/*.go({token: this.auth_token, secret: this.auth_secret})

			.response(this, function(inSender, inGoodies) {
				this.$.output.addContent

		(enyo.json.stringify(inGoodies) + "<hr/>");
		});*/
	},
	tokenAction: function() {
		new enyo.Ajax({ url: "https://www.box.com/api/1.0/rest?action=get_auth_token&api_key=" + this.apikey + "&ticket="+ this.auth_token, handleAs: "xml"})

			.go(/*{token: this.auth_token, secret: this.auth_secret}*/)
			.response(this, function(inSender, inGoodies) {

			xmlDoc = inGoodies.childNodes[0].childNodes[1].textContent;

			if (xmlDoc) {
				this.auth_token = xmlDoc;
				this.loadTree();
				this.cancelAction();
			}
		});
	},
	loadTree: function() {
	new enyo.Ajax({ url: "https://www.box.com/api/2.0/folders/0", headers: {"Authorization": "BoxAuth api_key=" + this.apikey + "&auth_token="+ this.auth_token}, handleAs: "json"})

		.go(/*{token: this.auth_token, secret: this.auth_secret}*/)

			.response(this, function(inSender, inGoodies) {

			//this.$.output.addContent(enyo.json.stringify(inGoodies) + "<br/>");
			console.log(enyo.json.stringify(inGoodies) + "<br/>");
				console.log(inGoodies);
			this.fileTree;

	});
},

	cancelAction: function() {
		this.doServerChange();
		this.bubble("onAuth");
		this.fileTree;
		this.bubble("onClose");
	},
});


enyo.kind({
	name: "BoxConfigPopup",
	kind: "onyx.Popup",
	published: {
	},
	events: {
	},
	handlers: {
		onClose: "closeAction"
	},
	closeAction: function() {
	console.log("closeAction");

		//this.hide();
		return true;
	}
});