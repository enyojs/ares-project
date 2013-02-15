enyo.kind({
	name: "ComponentView",
	events: {
		onSelect: "",
		onHighlightDropTarget: "",
		onUnHighlightDropTargets: "",
		onDrop: ""
	},
	handlers: {
		ondrag:	"drag",
		ondrop:	"drop"
	},
	style: "position: relative;",
	components: [
		{kind: "Scroller", classes: "enyo-fit", components: [
			{name: "client", style: "padding: 8px;"}
		]}
	],
	indent: 32,
	
	//* Component view events
	drag: function(inSender, inEvent) {
		return true;
	},
	drop: function(inSender, inEvent) {
		return true;
	},
	
	//* Draw component view visualization of component tree
	visualize: function(inComponents) {
		this.map = {};
		this.destroyClientControls();
		this._visualize(inComponents, 0);
		this.render();
	},
	//* Create an entry in the component view
	createEntry: function(inComponent, inIndent) {
		this.map[inComponent.name] = this.createComponent(
			{comp: inComponent, style: "padding-left: " + inIndent + "px;", attributes: {draggable: "true", dropTarget: "true"},
				ondown: "itemDown", ondragstart: "itemDragstart", ondragover: "itemDragover", ondragleave: "itemDragleave", ondrop: "itemDrop",
				components: [
					{tag: "b", content: inComponent.name, style: "pointer-events: none;"},
					{tag: "span", allowHtml: true, style: "pointer-events: none;", content: "&nbsp;(<i>" + inComponent.kind + "</i>)"}
				]
			}
		);
	},
	//* Create component view representation of designer
	_visualize: function(inComponents, inIndent) {
		for (var i=0, c; (c=inComponents[i]); i++) {
			this.createEntry(c, inIndent);
			if(c.components) {
				this._visualize(c.components, inIndent + this.indent);
			}
		}
	},
	//* Unhighlight existing selection and set _this.selection_ to _inComponent_
	select: function(inComponent) {
		if(this.selection) {
			this.unHighlightItem(this.selection);
		}
		
		this.selection = inComponent;
		this.highlightDragItem(this.selection);
	},
	//* Select control with _comp.id_ that matches _inComponent_
	setSelected: function(inComponent) {
		for(var i=0, c;(c=this.getClientControls()[i]);i++) {
			if(c.comp.id === inComponent.id) {
				this.select(c);
				return;
			}
		}
	},
	
	//* Item events
	itemDown: function(inSender, inEvent) {
		this.select(inSender);
		this.doSelect({component: inSender.comp});
	},
	itemDragstart: function(inSender, inEvent) {
		if(!inEvent.dataTransfer) {
			return true;
		}
		
		inEvent.dataTransfer.setData("Text", enyo.json.codify.to(inSender.comp));
		return true;
	},
	itemDragover: function(inSender, inEvent) {
		if(!inEvent.dataTransfer) {
			return false;
		}
		
		inEvent.preventDefault();
		
		// If sender is the current selection, set drop target to null (so highlighting still works properly)
		if(inSender === this.selection) {
			this.currentDropTarget = null;
			this.doUnHighlightDropTargets();
			return false;
		}
		
		//* Prevent repetitive events
		if(this.currentDropTarget && this.currentDropTarget === inSender) {
			return true;
		} else {
			this.currentDropTarget = inSender;
		}
		
		this.highlightDropTarget(this.currentDropTarget);
		this.doHighlightDropTarget({component: this.currentDropTarget.comp});
		
		return true;
	},
	itemDragleave: function(inSender, inEvent) {
		if(!inEvent.dataTransfer || inSender === this.selection) {
			return true;
		}
		
		this.unHighlightItem(inSender);
		return true;
	},
	itemDrop: function(inSender, inEvent) {
		if(!inEvent.dataTransfer) {
			return true;
		}
		
		this.unHighlightItem(inSender);
		this.doDrop({
			item:   enyo.json.codify.from(inEvent.dataTransfer.getData("Text")).id,
			target: inSender.comp.id
		});
		return true;
	},
	
	highlightDropTarget: function(inComponent) {
		if(typeof inComponent.origBackground === "undefined") {
			inComponent.origBackground = inComponent.domStyles.background || null;
			inComponent.applyStyle("background","#cedafe");
		}
	},
	highlightDragItem: function(inComponent) {
		if(typeof inComponent.origBackground === "undefined") {
			inComponent.origBackground = inComponent.domStyles.background || null;
			inComponent.applyStyle("background","orange");
		}
	},
	unHighlightItem: function(inComponent) {
		if(typeof inComponent.origBackground !== "undefined") {
			inComponent.applyStyle("background", inComponent.origBackground);
			inComponent.origBackground = undefined;
		}
	},
	syncDropTargetHighlighting: function(inComponent) {
		var id = inComponent ? inComponent.id : null;
		
		for(var i=0, c;(c=this.getClientControls()[i]);i++) {
			if(c.comp.id === id) {
				this.highlightDropTarget(c);
			} else if(c !== this.selection) {
				this.unHighlightItem(c);
			}
		}
	}
});
