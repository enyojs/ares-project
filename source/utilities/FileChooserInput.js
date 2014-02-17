enyo.kind({
	name: "Ares.FileChooserInput",
	classes: "ares-path-input",
	components: [
		{kind: "onyx.InputDecorator", name: "pathInputDecorator", components: [
			{kind: "onyx.Input", name: "pathInputValue", disabled: true, onchange: "pathInputChanged"},
			{kind: "onyx.IconButton", name:"pathInputButtonBroken", classes: "ares-file-broken-icon", src: "$assets/project-view/images/broken_path.png", showing: false, disabled: true},
			{kind: "onyx.IconButton", name:"pathInputButtonValid", classes: "ares-file-broken-icon", src: "$assets/project-view/images/valid_path.png", showing: false, disabled: true}
		]},
		{kind: "onyx.IconButton", name:"pathInputButton", src: "$assets/harmonia/images/folder-open.png", ontap: "pathInputTap"}
	],
	published: {
		pathValue: "",
		status: false,
		inputDisabled: false,
		activePathInputButton: false,
		inputTip: "",
		buttonTip: "",
		inputClasses: "",
		buttonClasses: "",
		decoratorClasses: ""
	},
	events: {
		onFileChooserAction: "",
		onInputChanged: ""
	},
	debug: false,
	create: function(){
		ares.setupTraceLogger(this);	// Setup this.trace() function according to this.debug value
		this.inherited(arguments);
		this.pathValueChanged();
		this.inputDisabledChanged();
		this.activePathInputButtonChanged();
		this.statusChanged();
		this.inputTipChanged();
		this.buttonTipChanged();
		if(this.inputClasses) {
			this.$.pathInputValue.addClass(this.inputClasses);
		}
		if(this.buttonClasses) {
			this.$.pathInputButton.addClass(this.buttonClasses);
		}
		if(this.decoratorClasses){
			this.$.pathInputDecorator.addClass(this.decoratorClasses);
		}
	},
	pathValueChanged: function(){
		this.$.pathInputValue.setValue(this.pathValue);
	},
	hideStatusNotification: function(){
		this.$.pathInputButtonBroken.setShowing(false);
		this.$.pathInputButtonValid.setShowing(false);
	},
	statusChanged: function(){
		if(this.status){
			this.$.pathInputButtonBroken.setShowing(false);
			this.$.pathInputButtonValid.setShowing(true);
		} else {
			this.$.pathInputButtonBroken.setShowing(true);
			this.$.pathInputButtonValid.setShowing(false);
		}

		if(!this.activePathInputButton){
			this.hideStatusNotification();
		}
	},
	inputDisabledChanged: function(){
		this.$.pathInputValue.setDisabled(this.inputDisabled);
	},
	activePathInputButtonChanged: function(){
		this.$.pathInputButton.setShowing(this.activePathInputButton);
	},
	inputTipChanged: function(){
		this.$.pathInputValue.setAttribute("title", this.inputTip);
	},
	buttonTipChanged: function(){
		this.$.pathInputButton.setAttribute("title", this.buttonTip);
	},
	pathInputTap: function(){
		this.doFileChooserAction();
	},
	pathInputChanged: function(){
		this.pathValue = this.$.pathInputValue.getValue();
		this.doInputChanged();
	},
});
