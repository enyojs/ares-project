/**
	_Ares.PickerButton_  is a button that, when tapped, shows an
	[onyx.Picker](#onyx.Picker). Once an item is selected, the list of items
	closes, but the item stays selected and the PickerButton displays the choice
	that was made.

	Ares.PickerButton inherits from Onyx.Picker and adds the display of  an arrow in the button

	For more information, see the documentation on
	[Pickers](building-apps/controls/pickers.html) in the Enyo Developer Guide.
 */
enyo.kind({
	name: "Ares.PickerButton",
	kind: "onyx.PickerButton",
	classes :"ares-picker enyo-border-box",
	components: [
		{name:"pickerValue", classes: "ares-picker-value enyo-border-box"},
		{name: "arrowContainer", classes: "ares-picker-arrow enyo-border-box"}
	],
	handlers: {
		onChange: "change"
	},
	change: function(inSender, inEvent) {
		if (inEvent.content !== undefined){
			this.$.pickerValue.setContent(inEvent.content);
		}
	},
	setPickerContent: function(content){
		this.$.pickerValue.setContent(content);
	}
});