enyo.kind({
	name: "ProjectProperties",
	classes: "enyo-unselectable",
	fit: true,
	debug: false,
	components: [
	    {kind: "FittableRows", fit: true, name: "fittableRows", components: [
	    	{content: "Settings", style: "width:100%; color: lightblue"},
	    	{tag: "br"},
			{kind: "FittableColumns", name: "fittableColumns", style: "width:100%", components: [
					{kind: "Control", content: "Format: ", name: "control4format"},
					{fit: true},
					{kind: "onyx.InputDecorator", content: "Format: ", name: "inputDecorator", components: [
							{kind: "Input", disabled: true, placeholder: "1", name: "format"}
						]}
				]},
			{kind: "FittableColumns", name: "fittableColumns2", style: "width:100%", components: [
					{kind: "Control", content: "Project Id:", name: "control4Id"},
					{fit: true},
					{kind: "onyx.InputDecorator", name: "inputDecorator2", components: [
							{kind: "onyx.Input", placeholder: "com.example.myapp", name: "projectId"}
						]},
				]},
			{kind: "FittableColumns", name: "fittableColumns3", style: "width:100%", components: [
					{kind: "Control", content: "Project Name:", name: "control4Name"},
					{fit: true},
					{kind: "onyx.InputDecorator", name: "inputDecorator3", components: [
							{kind: "onyx.Input", defaultFocus: true,  placeholder: "My Project Name", name: "projectName"}
					]},
				]},
			{kind: "FittableColumns", name: "fittableColumns4", style: "width:100%", components: [
					{kind: "Control", content: "Version:", name: "control4version"},
					{fit: true},
					{kind: "onyx.InputDecorator", name: "inputDecorator4", components: [
							{kind: "onyx.Input", disabled: true, placeholder: "1.0", name: "projectVersion"}
					]},
				]},	
			{tag: "br"},
			{content: "PhoneGap ...", style: "width:100%; color: lightblue", ontap:"activateDrawer"},
					{tag: "br"},
					{name: "phoneGapDrawer", kind: "onyx.Drawer", open:false, components: [
					{kind: "FittableColumns", name: "fittableColumns5", style: "width:100%", components: [
						{kind: "Control", content: "Target Build:", name: "control4target"},
						{fit: true},
						{kind: "onyx.InputDecorator", name: "inputDecorator5", components: [
							{kind: "onyx.Input", placeholder: "Enter your target build", name: "targetBuild"}
						]},
					]},	
					{kind: "FittableColumns", name: "fittableColumns6", style: "width:100%", components: [
						{kind: "Control", content: "PhoneGap Key:", name: "control4key"},
						{fit: true},
						{kind: "onyx.InputDecorator", name: "inputDecorator6", components: [
							{kind: "onyx.Input", placeholder: "Enter your key", name: "phonegapKey"}
						]},
					]},	
				]},
			{tag: "br"},
			{kind: "FittableColumns", style: "width:100%", name: "fittableColumns10", components: [
					{kind: "Control", name: "control4buttons"},
					{fit: true},
					{kind: "onyx.Button", content: "Cancel", classes: "onyx-negative", name: "cancel", ontap: "doCancel"},
					{kind: "onyx.Button", content: "Apply", classes: "onyx-affirmative", name: "confirm", ontap: "doApply"}
				]}
		]},
    ],
    create: function() {
    	this.inherited(arguments);
    },
	activateDrawer: function() {
		this.$.phoneGapDrawer.setOpen(!this.$.phoneGapDrawer.open);
	},
});

enyo.kind({
	name: "ProjectPropertiesPopup",
	kind: "onyx.Popup",
	modal: true, centered: true, floating: true, autoDismiss: false,
	components: [
        {kind: "ProjectProperties"}
	],
	reset: function() {
		this.$.projectProperties.reset();
	},
	doCancel: function (inSender, inEvent) {
		this.$.projectProperties.hide();
	}
});

// enyo.kind({
// 	name: "onyx.sample.DrawerSample",
// 	classes: "onyx drawer-sample",
// 	components: [
// 		{content: "Drawers", classes:"drawer-sample-divider"},
// 		{content: "Activate (V)", classes: "drawer-sample-box drawer-sample-mtb", ontap:"activateDrawer"},
// 		{name: "drawer", kind: "onyx.Drawer", components: [
// 			{content: "Vertical Drawer<br>Vertical Drawer<br>Vertical Drawer<br>Vertical Drawer", allowHtml: true, classes: "drawer-sample-box drawer-sample-mtb"},
// 			{content: "Activate (V)", classes: "drawer-sample-box drawer-sample-mtb", ontap:"activateDrawer2"},
// 			{name: "drawer2", kind: "onyx.Drawer", components: [
// 				{content: "Vertical Drawer<br>Vertical Drawer<br>Vertical Drawer<br>Vertical Drawer", allowHtml: true, classes: "drawer-sample-box drawer-sample-mtb"}
// 			]},
// 			{content: "Vertical Drawer<br>Vertical Drawer<br>Vertical Drawer<br>Vertical Drawer", allowHtml: true, classes: "drawer-sample-box drawer-sample-mtb"}
// 		]},
// 		{content: "Foo<br>Foo", allowHtml: true, classes: "drawer-sample-box drawer-sample-mtb"},
// 		{kind: "FittableColumns", fit: true, ontap: "activateColumnsDrawer", classes: "drawer-sample-box drawer-sample-mtb drawer-sample-o", components: [
// 			{content: "Activate (H)", classes: "drawer-sample-box drawer-sample-mlr"},
// 			{name: "columnsDrawer", orient: "h", kind: "onyx.Drawer", open: false, components: [
// 				{content: "H-Drawer", classes: "drawer-sample-box drawer-sample-mlr"}
// 			]},
// 			{content: "Foo", fit: true, classes: "drawer-sample-box drawer-sample-mlr drawer-sample-o"},
// 			{content: "Foo", classes: "drawer-sample-box drawer-sample-mlr"}
// 		]},
// 		{content: "Foo", classes: "drawer-sample-box drawer-sample-mtb"}
// 	],
// 	activateDrawer: function() {
// 		this.$.drawer.setOpen(!this.$.drawer.open);
// 	},
// 	activateDrawer2: function() {
// 		this.$.drawer2.setOpen(!this.$.drawer2.open);
// 	},
// 	activateColumnsDrawer: function() {
// 		this.$.columnsDrawer.setOpen(!this.$.columnsDrawer.open);
// 		return true;
// 	}
// });