enyo.kind({
	name: "Ares.FileChooserInput",
	classes: "ares-path-input",
	components: [
		{kind: "onyx.InputDecorator", name: "pathInputDecorator", components: [
			{kind: "onyx.Input", name: "pathInputValue", disabled: true, onchange: "pathInputChanged"},
			{kind: "onyx.IconButton", name:"pathInputButtonBroken", classes: "ares-file-broken-icon", src: "$project-view/assets/images/file_broken-20x17.png", showing: false, disabled: true}
		]},
		{kind: "onyx.IconButton", name:"pathInputButton", src: "$project-view/assets/images/file-32x32.png", ontap: "pathInputTap"}
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
	statusChanged: function(){
		if(this.status){
			this.$.pathInputButtonBroken.setShowing(false);
		} else{
			this.$.pathInputButtonBroken.setShowing(true);
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