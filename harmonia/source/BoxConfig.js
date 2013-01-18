console.log("box config");
// var Api = "uxr6ab2ge57318sm3mgbv5e0ntmji52k";
 enyo.kind({
	name: "Box", 
	kind: "FittableRows",

	// private members
	debug: false,
	
	// public members
	published: {
		serviceId: "",		// from ide.json
		serviceName: "",	// from ide.json
		auth: {}
	},

	// emitted events
	events: {
		onServerChange: "",
		//onUpdateAuth: "",
	//	onError: "",
	//	onStartWaiting: "",
	//	onStopWaiting: ""
	},
	components: [
		{kind: "Ares.Groupbox", components: [
			{kind: "onyx.GroupboxHeader", name: "serviceName"},
			{components: [
				{content: "User Name: ", kind: "Ares.GroupBoxItemKey"},
				{name: "username", kind: "Ares.GroupBoxItemValue"}
			]},
			{components: [
				{content: "Email: ", kind: "Ares.GroupBoxItemKey"},
				{name: "email", kind: "Ares.GroupBoxItemValue"}
			]},
			{components: [
				{content: "Country Code:", kind: "Ares.GroupBoxItemKey"},
				{name: "country", kind: "Ares.GroupBoxItemValue"}
			]},
			{components: [
				{content: "Quota (Max):", kind: "Ares.GroupBoxItemKey"},
				{name: "quota", kind: "Ares.GroupBoxItemValue"}
			]},
			{components: [
				{content: "Usage (Private):", kind: "Ares.GroupBoxItemKey"},
				{name: "normal", kind: "Ares.GroupBoxItemValue"}
			]},
			{components: [
				{content: "Usage (Shared):", kind: "Ares.GroupBoxItemKey"},
				{name: "shared", kind: "Ares.GroupBoxItemValue"}
			]}
		]},
		{kind: "FittableColumns", components: [
			{name: "renewBtn", kind: "onyx.Button", content: "Authorize Ares", disabled: false, ontap: "tokenAction"},
		//	{name: "checkBtn", kind: "onyx.Button", content: "Check", disabled: true, ontap: "check"}
		]},
		{name: "footnote"},
		
		
		
	//	{name: "TokenButton", kind: "Button", content: "Authorize Ares", ontap: "tokenAction", disabled: true},
		{name: "output", allowHtml: true},

		{name: "tree", kind: "Scroller", fit: true,	components: [
			{kind: "Node", classes: "enyo-unselectable", showing: true, file: {id: ".",name: "server",isServer: true},
			content: "server",
			icon: "source/lib/service/images/antenna.png",
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
		//console.log(this.$.auth_token);
		this.authAction();
	},
	authAction: function() {
		//this.$.output.addContent("Requesting tokens...<br/>");
		var request = new enyo.Ajax({
		url: "https://www.box.com/api/1.0/rest?action=get_ticket&api_key=" + this.apikey,
		handleAs: "xml"
	});
	request.response(this, function(inSender, inGoodies) {
	console.log(inGoodies);

	xmlDoc = inGoodies.childNodes[0].childNodes[1].textContent;
	//console.log(xmlDoc);
	if (xmlDoc) {
		this.auth_token = xmlDoc;
		console.log(this.auth_token);
		auth_token = (this.auth_token);

		console.log(auth_token);
		//this.$.output.addContent(xmlDoc);
		this.listAction();
		//this.$.listButton.setDisabled(false);
		} else {
			this.$.output.addContent("failed" + inGoodies);
		}
	});
	request.go(/*{user: "user", password: "password"}*/);
},
	listAction: function() {
	//this.$.output.addContent("Requesting list...[" + this.$.listInput.getValue() + "]<br/>");
	window.open("https://www.box.com/api/1.0/auth/" + this.auth_token);
	this.$.TokenButton.setDisabled(false);

		/*.go({token: this.auth_token, secret: this.auth_secret})

			.response(this, function(inSender, inGoodies) {
				this.$.output.addContent

		(enyo.json.stringify(inGoodies) + "<hr/>");
		});*/
	},
	tokenAction: function() {
	//https://www.box.com/api/1.0/rest?action=get_auth_token&api_key={your api key}&ticket={your ticket}
	//console.log({ url: "https://www.box.com/api/1.0/rest?action=get_auth_token&api_key=" + this.apikey + "&ticket="+ this.auth_token, handleAs: "xml"});
	new enyo.Ajax({ url: "https://www.box.com/api/1.0/rest?action=get_auth_token&api_key=" + this.apikey + "&ticket="+ this.auth_token, handleAs: "xml"})

	.go(/*{token: this.auth_token, secret: this.auth_secret}*/)
	.response(this, function(inSender, inGoodies) {
	//console.log(inGoodies);
	xmlDoc = inGoodies.childNodes[0].childNodes[1].textContent;
	console.log(xmlDoc);
	if (xmlDoc) {
		this.auth_token = xmlDoc;
		console.log(this.auth_token);
		this.loadTree();
		this.cancelAction();

	}
});
},
	loadTree: function() {
//console.log(apikey),
//console.log(auth_token),
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
//console.log("cancel");
this.doServerChange();
this.bubble("onAuth");
this.fileTree;
//this.$.BoxFileTree.GetRoot();
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