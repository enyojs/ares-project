enyo.kind({
	name: "ProjectManger",
	kind: "enyo.FittableRows",
	style: "width: 33%",
	components: [
		{kind: "onyx.Toolbar",
		style: "height: 65px",
		components: [
			{content: "Project Management"}
		]},
		{kind: "Panels",
		fit:true,
		classes: "enyo-unselectable",
		components: [
			{kind: "enyo.Scroller",
			classes: "enyo-fit",
			components: [
				{name: "devSetting",
				classes: "pannel",
				style: " height: 200px",
				components: [
					{style: "padding: 8px; background-color: #E1E2E4; color: #5CA7E8; text-transform: uppercase; font-weight: bold; font-size: 1.2em;",
					content:"Developers Settings "},

					{kind: "FittableColumns",
					components: [
						{content: "Dev Name: "},
						{name: "dn", content: "", fit:true}

					]},
					{kind: "FittableColumns",
					components: [
						{content: "Dev ID: "},
						{name: "di", content: "", fit:true}

					]},

					{kind: "FittableColumns",
					components: [
						{content: "Dev Web Site: "},
						{name: "dw", content: "", fit:true}

					]},
					{kind: "onyx.InputDecorator",
					classes: "inputButton",
					components: [
						{name: "appName",
						kind: "onyx.Input",
						placeholder: "App Name.....",
						onchange: "appName"
						}
					]},
					{tag: "br"},
					{style: "height: 25px"},
					{kind: "onyx.Button", classes: "onyx-affirmative", content: "Set Dev Settings", ontap:"setDevInfo"}
				]},
				{name: "projectSetting", classes: "pannel", style: " height: 150px",
				components: [
					{style: "padding: 8px; background-color: #E1E2E4; color: #5CA7E8; text-transform: uppercase; font-weight: bold; font-size: 1.2em;",
					content:"Project Settings "},
					{kind: "onyx.RadioGroup", onActivate:"radioActivated", components:[
						{content:"Palm/HP", classes: "RadioGroup"},
						{content:"Phone Gap", classes: "RadioGroup"},
						{content:"Web", classes: "RadioGroup"}
					]}

				]},
				{name: "Build", classes: "pannel", style: " height: 200px",
				components: [
					{style: "padding: 8px; background-color: #E1E2E4; color: #5CA7E8; text-transform: uppercase; font-weight: bold; font-size: 1.2em;",
					content:"Build/Package "},
					{kind: "onyx.Button", classes: "onyx-affirmative", content: "Build our Package for Editing", ontap:"Build"},
					{style: "height: 5px"},
					{kind: "onyx.Button", classes: "onyx-affirmative", content: "Pack up our files for shipment", ontap:"pack"}
				]},
				{name: "Publish", classes: "pannel", style: " height: 200px",
				components: [
					{style: "padding: 8px; background-color: #E1E2E4; color: #5CA7E8; text-transform: uppercase; font-weight: bold; font-size: 1.2em;",
					content:"Publish"},
					{kind: "onyx.Button", classes: "onyx-affirmative", content: "Publish", ontap:"Publish"}
				]}
			]}
		]},
		{name: "devSet",
		kind: "enyo.Popup",
		classes: "popup",
		centered: true,
		style: "padding: 10px;",
		floating: true,
		components: [
			{kind: "enyo.FittableRows",
			fit: "true",
			components: [
				{kind: "onyx.InputDecorator",
				classes: "inputButton",
				components: [
					{name: "devName",
					kind: "onyx.Input",
					placeholder: "Dev Name.......",
					onchange: "inputChange"
					}
				]},
				{kind: "onyx.InputDecorator",
				classes: "inputButton",
				components: [
					{name: "devId",
					kind: "onyx.Input",
					placeholder: "Dev ID.........",
					onchange: "inputChange"
					}
				]},
				{kind: "onyx.InputDecorator",
				classes: "inputButton",
				components: [
					{name: "devWeb",
					kind: "onyx.Input",
					placeholder: "Dev Web Site...",
					onchange: "inputChange"
				}
				]},
				{kind: "onyx.Button", classes: "onyx-affirmative", content: "Close Dev Settings", ontap:"closeDevInfo"}
			]}
		]}
	],

	create: function() {
		this.inherited(arguments);

		this.devName = localStorage.devName;
		this.devId = localStorage.devId;
		this.devWeb = localStorage.devWeb;

		this.$.dn.setContent(this.devName);
		this.$.di.setContent(this.devId);
		this.$.dw.setContent(this.devWeb);
	},

	setDevInfo: function(inSender,inEvent){

		this.$.devSet.show();
	},

	closeDevInfo: function(inSender,inEvent){
		this.devName = this.$.devName.hasNode().value;
		this.$.dn.setContent(this.devName);
		this.devId = this.$.devId.hasNode().value;
		this.$.di.setContent(this.devId);
		this.devWeb = this.$.devWeb.hasNode().value;
		this.$.dw.setContent(this.devWeb);

		localStorage.devName = this.devName;
		localStorage.devId = this.devId;
		localStorage.devWeb = this.devWeb;
		this.$.devSet.hide();
	},

	build: function(inSender,inEvent){
		if(this.buildType == "Palm/HP"){
			//this is were we make our

		}
		if(this.buildType == "Phone Gap"){
				//this is were we make our

		}
		if(this.buildType == "Web"){
				//this is were we make our

		}

	},

	pack: function(inSender,inEvent){
		if(this.buildType == "Palm/HP"){


		}
		if(this.buildType == "Phone Gap"){


		}
		if(this.buildType == "Web"){


		}
	},

	publish: function(inSender,inEvent){

	},

	radioActivated: function(inSender, inEvent) {
		if (inEvent.originator.getActive()) {
			this.color = "#000000";
			this.buildType = inEvent.originator.getContent();
		}
	}


});