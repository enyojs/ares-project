enyo.kind(
	{
		name: "ProjectPreview",
		kind: "Control",
		published: {
		},
		events: {
		},
		components: [
			{
				kind: "Control",
				tag: "span",
				style: "padding: 0 4px; vertical-align: middle;",
				content: "Project Preview"
			},
			{kind: "onyx.Button", content: "orientation"},
			{kind: "ScrolledIframe", fit: true}
		],
		create: function() {
			this.inherited(arguments);
			// initialization code goes here
		}
	}
);

enyo.kind(
	{
		name: "Dod",
		kind: "ScrolledIframe",
		//classes: "enyo-fit",
		//horizontal: 'scroll',
		//vertical: 'scroll',
		style: "border: solid 1px blue; width: 400px; height: 600px;" ,
		components: [
			{
				kind: "ares.IFrame",
				name: 'iframe'
			}
		]
	}
);

