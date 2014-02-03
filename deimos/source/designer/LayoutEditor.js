/*global enyo */

enyo.kind({
	name: "Inspector.LayoutEditor",
	kind: "enyo.Control",
	published: {
		//* Current _layoutKind_ property for selected control
		layoutKind: null,
		//* Array of all possible _layoutKind_ values
		layoutKinds: null,
		//* Current layout-related style properties for selected control
		styleProps: null,
		//* Default values for layout-related style properties
		defaultStyleProps: {
			position : {
				val: "static",
				disabled: false
			},
			top : {
				val: "",
				disabled: true
			},
			left : {
				val: "",
				disabled: true
			},
			bottom : {
				val: "",
				disabled: true
			},
			right : {
				val: "",
				disabled: true
			},
			width : {
				val: "",
				disabled: true
			},
			height : {
				val: "",
				disabled: true
			}
		}
	},
	events: {
		onRequestPositionValue: "",
		onPositionDataUpdated: "",
		onPositionPropertyChanged: ""
	},
	handlers: {
		onSetRequestedPositionValue: "setRequestedPositionValue"
	},
	components: [
		{classes: "onyx-groupbox-header", content: "Layout Kind"},
		{name: "layoutKindRow", classes: "ares-inspector-row"},
		{classes: "onyx-groupbox-header", content: "Position"},
		{name: "positionEditorContainer", onUpdateProps: "handleUpdateProps"},
		{classes: "onyx-groupbox-header", content: "Properties"}
	],
	//* @protected
	create: function() {
		//* Do whatchya gotta do
		this.inherited(arguments);
		//* Create initial _this.styleProps_ values
		this.setupStyleProps();
		//* Add the _layoutKind_ picker
		this.createLayoutKindPicker();
		//* Add the position editor
		this.createPositionEditor();
		//* Create a text field for each property in _styleProps_
		this.createPropertyFields();
	},
	//* Create a picker for the _layoutKind_ property
	createLayoutKindPicker: function() {
		this.$.layoutKindRow.createComponent({
			name: "attributeVal-layoutKind",
			kind: "Inspector.Config.Select",
			classes: "layout-kind-select",
			fieldName: "layoutKind",
			fieldValue: this.getLayoutKind(),
			values: this.getLayoutKinds(),
			disabled: false
		});
	},
	//* Fill in any missing properties from _this.styleProps_ with _this.defaultStyleProps_
	setupStyleProps: function() {
		var defaultProps = enyo.clone(this.getDefaultStyleProps()),
			props = enyo.clone(this.getStyleProps()),
			returnProps = {},
			prop
		;

		// Go through each default, and if it doesn't exist in _this.styleProps_, use the default
		for (prop in defaultProps) {
			returnProps[prop] = (props[prop]) ? enyo.clone(props[prop]) : enyo.clone(defaultProps[prop]);
		}

		this.setStyleProps(enyo.clone(returnProps));
	},
	//* Create an instance of _Inspector.PositionEditor_ passing in _this.styleProps_
	createPositionEditor: function() {
		this.$.positionEditorContainer.createComponent({
			kind: "Inspector.PositionBox",
			name: "positionEditor",
			props: this.getStyleProps()
		});
	},
	//* Create property text fields for each property in _this.styleProps_
	createPropertyFields: function() {
		var properties = this.getStyleProps(),
			prop,
			row
		;

		for (prop in properties) {
			row = this.createComponent({classes: "ares-inspector-row"});
			row.createComponent(
				{
					name: "attributeVal-" + prop,
					kind: "Inspector.Config.Text",
					fieldName: prop,
					fieldValue: properties[prop].val,
					disabled: properties[prop].disabled,
					onChange: "positionPropertyChanged"
				},
				{owner: this}
			);
		}
	},
	positionPropertyChanged: function(inSender, inEvent) {
		this.doPositionPropertyChanged(inEvent);
		return true;
	},
	//* Catch _onUpdateProps_ event sent from position editor
	handleUpdateProps: function(inSender, inEvent) {
		var $field,
			requestData,
			focused
		;

		for(var i = 0, prop; (prop = inEvent.changedProps[i]); i++) {
			$field = this.$["attributeVal-" + prop];
			if (inEvent.props[prop].disabled) {
				$field.setDisabled(true);
				$field.setFieldValue("");
			} else {
				$field.setDisabled(false);
				if (inEvent.changedSide === prop && inEvent.changedProps.length <= 1) {
					focused = true;
				} else {
					requestData = {prop: prop};
				}
			}
		}

		if (requestData) {
			this.doRequestPositionValue(requestData);
		} else if (!focused) {
			this.dataPositionUpdated();
		}

		return true;
	},
	//* Set the auto-generated field value for the specified property
	setRequestedPositionValue: function(inSender, inEvent) {
		var $field = this.$["attributeVal-" + inEvent.prop];
		$field.setFieldValue(inEvent.value + "px");
		this.dataPositionUpdated();
	},
	//* Update position data
	dataPositionUpdated: function() {
		var $field,
			value,
			props = {
				top: "",
				right: "",
				bottom: "",
				left: "",
				height: "",
				width: ""
			}
		;

		for (var prop in props) {
			$field = this.$["attributeVal-" + prop];
			value = $field.getFieldValue();
			props[prop] = value;
		}

		this.doPositionDataUpdated({props: props});
	}
});

enyo.kind({
	name: "Inspector.PositionBox",
	classes: "ares-inspector-position-editor",
	published: {
		props:  null
	},
	events: {
		onUpdateProps: ""
	},
	components: [
		{name: "topToggle", classes: "top-toggle anchor-toggle", side: "top", components: [{classes: "anchor-line"}], ontap: "toggleSide"},
		{name: "rightToggle", classes: "right-toggle anchor-toggle", side: "right", components: [{classes: "anchor-line"}], ontap: "toggleSide"},
		{name: "bottomToggle", classes: "bottom-toggle anchor-toggle", side: "bottom", components: [{classes: "anchor-line"}], ontap: "toggleSide"},
		{name: "leftToggle", classes: "left-toggle anchor-toggle", side: "left", components: [{classes: "anchor-line"}], ontap: "toggleSide"},
		{name: "innerBox", classes: "ares-inspector-position-editor-inner-box", components: [
			{name: "widthToggle", classes: "width-toggle anchor-toggle", side: "width", components: [{classes: "anchor-line"}], ontap: "toggleSide"},
			{name: "heightToggle", classes: "height-toggle anchor-toggle", side: "height", components: [{classes: "anchor-line"}], ontap: "toggleSide"},
		]}
	],
	create: function() {
		this.inherited(arguments);
		this.propsChanged();
	},
	propsChanged: function() {
		this.topChanged();
		this.rightChanged();
		this.bottomChanged();
		this.leftChanged();
		this.widthChanged();
		this.heightChanged();
	},
	topChanged: function() {
		this.$.topToggle.getClientControls()[0].addRemoveClass("disabled", this.props.top.disabled);
	},
	rightChanged: function() {
		this.$.rightToggle.getClientControls()[0].addRemoveClass("disabled", this.props.right.disabled);
	},
	bottomChanged: function() {
		this.$.bottomToggle.getClientControls()[0].addRemoveClass("disabled", this.props.bottom.disabled);
	},
	leftChanged: function() {
		this.$.leftToggle.getClientControls()[0].addRemoveClass("disabled", this.props.left.disabled);
	},
	widthChanged: function() {
		this.$.widthToggle.getClientControls()[0].addRemoveClass("disabled", this.props.width.disabled);
	},
	heightChanged: function() {
		this.$.heightToggle.getClientControls()[0].addRemoveClass("disabled", this.props.height.disabled);
	},
	toggleSide: function(inSender, inEvent) {
		var side = inSender.side,
			props = this.props,
			changedProps = [side]
		;

		props[side].disabled = !props[side].disabled;

		switch (side) {
		case "top":
			if (props.top.disabled) {
				// Top: off, Bottom: off --> Bottom: on
				if (props.bottom.disabled) {
					props.bottom.disabled = false;
					changedProps.push("bottom");
					// Top: off, Bottom: on, Height: off --> Height: on
				} else if (props.height.disabled) {
					props.height.disabled = false;
					changedProps.push("height");
				}
			} else {
				if (!props.bottom.disabled) {
					// Top: on, Bottom: on, Height: on --> Height: off
					if (!props.height.disabled) {
						props.height.disabled = true;
						changedProps.push("height");
					}
				}
			}
			break;
		case "right":
			if (props.right.disabled) {
				// Right: off, Left: off --> Left: on
				if (props.left.disabled) {
					props.left.disabled = false;
					changedProps.push("left");
					// Right: off, Left: on, Width: off --> Width: on
				} else if (props.width.disabled) {
					props.width.disabled = false;
					changedProps.push("width");
				}
			} else {
				if (!props.left.disabled) {
					// Right: on, Left: on, Width: on --> Width: off
					if (!props.width.disabled) {
						props.width.disabled = true;
						changedProps.push("width");
					}
				}
			}
			break;
		case "bottom":
			// Bottom: off, Top: off --> Top: on
			if (props.bottom.disabled) {
				if (props.top.disabled) {
					props.top.disabled = false;
					changedProps.push("top");
					// Bottom: off, Top: on, Height: off --> Height: on
				} else if (props.height.disabled) {
					props.height.disabled = false;
					changedProps.push("height");
				}
			} else {
				if (!props.top.disabled) {
					// Bottom: on, Top: on, Height: on --> Height: off
					if (!props.height.disabled) {
						props.height.disabled = true;
						changedProps.push("height");
					}
				}
			}
			break;
		case "left":
			if (props.left.disabled) {
				// Left: off, Right: off --> Right: on
				if (props.right.disabled) {
					props.right.disabled = false;
					changedProps.push("right");
					// Left: off, Right: on, Width: off --> Width: on
				} else if (props.width.disabled) {
					props.width.disabled = false;
					changedProps.push("width");
				}
			} else {
				if (!props.right.disabled) {
					// Left: on, Right: on, Width: on --> Width: off
					if (!props.width.disabled) {
						props.width.disabled = true;
						changedProps.push("width");
					}
				}
			}
			break;
		case "width":
			if (props.width.disabled) {
				// Width: off, Left: off --> Left: on
				if (props.left.disabled) {
					props.left.disabled = false;
					changedProps.push("left");
				}
				// Width: off, Right: off --> Right: on
				if (props.right.disabled) {
					props.right.disabled = false;
					changedProps.push("right");
				}
			} else {
				if (!props.left.disabled) {
					// Width: on, Left: on, Right: on --> Right: off
					if (!props.right.disabled) {
						props.right.disabled = true;
						changedProps.push("right");
					}
				}
			}
			break;
		case "height":
			if (props.height.disabled) {
				// Height: off, Top: off --> Top: on
				if (props.top.disabled) {
					props.top.disabled = false;
					changedProps.push("top");
				}
				// Height: off, Bottom: off --> Bottom: on
				if (props.bottom.disabled) {
					props.bottom.disabled = false;
					changedProps.push("bottom");
				}
			} else {
				if (!props.top.disabled) {
					// Height: on, Top: on, Bottom: on --> Bottom: off
					if (!props.bottom.disabled) {
						props.bottom.disabled = true;
						changedProps.push("bottom");
					}
				}
			}
			break;
		default:
			break;
		}

		this.propsChanged();
		this.doUpdateProps({changedSide: side, changedProps: changedProps, props: props});
	}
});
