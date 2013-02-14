enyo.kind({
	name: "Ares.App",
	kind: "FittableColumns",
	classes: "enyo-fit",
	handlers: {
		ondown:			"down",
		ondragstart:	"dragstart",
		ondragover: 	"dragover",
		ondragleave:	"dragleave",
		ondrop:			"drop"
	},
	components: [
		{name: "client", fit: true, classes:"enyo-fit"},
		{name: "serializer", kind: "Serializer"},
		{name: "communicator", kind: "RPCCommunicator", onMessage: "receiveMessage"}
	],
	selectedItem: null,
	create: function() {
		this.inherited(arguments);
		this.addHandlers();
	},
	rendered: function() {
		this.inherited(arguments);
		this.sendMessage({op: "state", val: "ready"});
	},
	
	sendMessage: function(inMessage) {
		this.$.communicator.sendMessage(inMessage);
	},
	receiveMessage: function(inSender, inEvent) {
		var msg = inEvent.message;
		
		if(msg.op === "render") {
			if(this.renderKind(msg.val.name)) {
				var c = this.$.client.getClientControls()[0];
				this.sendMessage({op: "rendered", val: this.$.serializer.serialize(c)});
			}
		} else if(msg.op === "select") {
			this.selectItem(msg.val);
		} else if(msg.op === "highlight") {
			this.highlightItem(msg.val);
		} else if(msg.op === "modify") {
			this.modifyProperty(msg.val);
		} else if(msg.op === "unhighlight") {
			this.unhighlightDropTargets();
		} else if(msg.op === "drop") {
			this.simulateDrop(msg.val);
		}
	},
	
	//* Highlight the specified conrol and send a message with a serialized copy of the control
	selectItem: function(inItem) {
		this.selectedItem = null;
		
		for(var i=0, c;(c=this.flattenChildren(this.$.client.children)[i]);i++) {
			if(c.id === inItem.id) {
				this.selectedItem = c;
				this.highlightDragItem(c);
			} else {
				this.unHighlightItem(c);
			}
		}
		
		this.sendMessage({op: "selected", val: this.$.serializer.serializeComponent(this.selectedItem)});
	},
	highlightItem: function(inItem) {
		for(var i=0, c;(c=this.flattenChildren(this.$.client.children)[i]);i++) {
			if(c.id === inItem.id) {
				this.highlightDropTarget(c);
			} else if(c !== this.selectedItem) {
				this.unHighlightItem(c);
			}
		}
	},
	unhighlightDropTargets: function(inItem) {
		for(var i=0, c;(c=this.flattenChildren(this.$.client.children)[i]);i++) {
			if(c !== this.selectedItem) {
				this.unHighlightItem(c);
			}
		}
	},
	//* When a drop happens in the component view, translate that to a drop in this iframe.
	simulateDrop: function(inDropData) {
		var itemId   = inDropData.item,
			targetId = inDropData.target,
			item = null,
			target = null;
		
		for(var i=0, c;(c=this.flattenChildren(this.$.client.children)[i]);i++) {
			if(c.id === itemId) {
				item = c;
			} else if(c.id === targetId) {
				target = c;
			}
		}
		
		this.unhighlightDropTargets();
		this.dropControl(item, target);
	},
	modifyProperty: function(inData) {
		this.selectedItem[inData.property] = inData.value;
		this.$.client.render();
	},
	
	//* Render the specified kind into the iFrame
	renderKind: function(inKindName) {
		var kindConstructor = window[inKindName];
		
		if(!kindConstructor) {
			this.log("No constructor exists for ", inKindName);
			return false;
		} else if(!kindConstructor.prototype) {
			this.log("No prototype exists for ", inKindName);
			return false;
		}
		
		this.$.client.destroyClientControls();
		var kindComponents = this.flattenKindComponents(kindConstructor.prototype.kindComponents);
		this.makeKindComponentsDraggable(kindComponents);
		this.flagAresComponents(kindComponents);
		
		this.$.client.createComponent({kind: inKindName}).render();
		
		return true;
	},
	
	//* Get each kind component individually
	flattenKindComponents: function(inComponents) {
		var ret = [],
			cs,
			c;
		
		for (var i=0;(c = inComponents[i]);i++) {
			ret.push(c);
			if(c.components) {
				cs = this.flattenKindComponents(c.components);
				for (var j=0;(c = cs[j]);j++) {
					ret.push(c);
				}
			}
		}
		
		return ret;
	},
	flattenChildren: function(inComponents) {
		var ret = [],
			cs,
			c;
		
		for (var i=0;(c = inComponents[i]);i++) {
			ret.push(c);
			if(c.children) {
				cs = this.flattenChildren(c.children);
				for (var j=0;(c = cs[j]);j++) {
					ret.push(c);
				}
			}
		}
		
		return ret;
	},
	
	//* Add the attribute _draggable="true"_ to each kind component
	makeKindComponentsDraggable: function(inComponents) {
		for(var i=0,child;(child = inComponents[i]);i++) {
			if(child.attributes) {
				child.attributes.draggable = "true";
				child.attributes.dropTarget = "true";
			} else {
				child.attributes = {
					draggable: "true",
					dropTarget: "true"
				};
			}
		}
	},
	
	flagAresComponents: function(inComponents) {
		for(var i=0, c;(c = inComponents[i]);i++) {
			c.aresComponent = "true";
		}
	},
	getAresComponents: function(inContainer) {
		// TODO
	},
	
	down: function(inSender, inEvent) {
		
	},
	dragstart: function(inSender, inEvent) {
		if(!inEvent.dataTransfer) {
			return false;
		}

		this.draggingItem = inEvent.originator;
		
		inEvent.dataTransfer.setData('Text', this.$.serializer.serializeComponent(this.draggingItem));
        return true;
	},
	dragover: function(inSender, inEvent) {
		if(!inEvent.dataTransfer) {
			return false;
		}
		
		inEvent.originator = this.updateDragOriginator(inEvent.originator);
		
		if(!inEvent.originator || inEvent.originator === this.draggingItem) {
			return false;
		}
		
		this.highlightDropTarget(inEvent.originator);
		
		inEvent.preventDefault();
		return true;
	},
	dragleave: function(inSender, inEvent) {
		if(!inEvent.dataTransfer) {
			return false;
		}
		
		inEvent.originator = this.updateDragOriginator(inEvent.originator);
		
		if(!inEvent.originator || inEvent.originator === this.draggingItem) {
			return false;
		}
		
		this.unHighlightItem(inEvent.originator);
		
		return true;
	},
	drop: function(inSender, inEvent) {
		if(!inEvent.dataTransfer) {
			return false;
		}
		
		inEvent.originator = this.updateDragOriginator(inEvent.originator);
		
		if(!inEvent.originator || inEvent.originator === this.draggingItem) {
			return false;
		}
		
		this.unhighlightDropTargets();
		
		/*
			If we have a dragging Item (i.e. the drag came from within the iframe),
			use it for the drop. Otherwise look at the dataTransfer data to find
			the dragging item.
		*/
		if(this.draggingItem) {
			this.dropControl(this.draggingItem, inEvent.originator);
			this.draggingItem = null;
		} else {
			this.foreignDrop(enyo.json.codify.from(inEvent.dataTransfer.getData("Text")), inEvent.originator);
		}
		
        return true;
	},
	//* Handle a drop that came from outside of the iframe
	foreignDrop: function(inDropData, inDropTarget) {
		var draggedItem,
			c,
			i;
		
		for(i=0;(c=this.flattenChildren(this.$.client.children)[i]);i++) {
			if(c.id === inDropData.id) {
				draggedItem = c;
			}
		}
		
		this.dropControl(draggedItem, inDropTarget);
	},
	
	updateDragOriginator: function(inComponent) {
		return (!this.isDropTarget(inComponent)) ? this.findNextDropTarget(inComponent) : inComponent;
	},
	isDropTarget: function(inComponent) {
		return (inComponent.attributes && inComponent.attributes.dropTarget && inComponent.attributes.dropTarget == "true");
	},
	findNextDropTarget: function(inComponent) {
		return (!inComponent.owner) ? null : (this.isDropTarget(inComponent.owner)) ? inComponent.owner : this.findNextDropTarget(inComponent.owner);
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
	
	
	
	dropControl: function(inDroppedControl, inTargetControl) {
		this.log("Drop item ", inDroppedControl.name, " onto item ", inTargetControl.name);
	},
	
	
	
	//* Add dispatch for native drag events
	addHandlers: function(inSender, inEvent) {
		document.ondragstart = enyo.dispatch;
		document.ondrag =      enyo.dispatch;
		document.ondragenter = enyo.dispatch;
		document.ondragleave = enyo.dispatch;
		document.ondragover =  enyo.dispatch;
		document.ondrop =      enyo.dispatch;
		document.ondragend =   enyo.dispatch;
	}
});

enyo.kind({
	name: "RPCCommunicator",
	kind: "enyo.Component",
	published: {
		remote: window.parent
	},
	events: {
		onMessage: ""
	},
	sendMessage: function(inMessage) {
		//this.log("iframe sending message:", inMessage);
		this.getRemote().postMessage({message: inMessage}, "*");
	},
	//* @protected
	create: function() {
		this.inherited(arguments);
		this.setupRPC();
	},
	remoteChanged: function() {
		this.inherited(arguments);
	},
	setupRPC: function() {
		enyo.dispatcher.listen(window, "message", enyo.bind(this, "receiveMessage"));
	},
	receiveMessage: function(inMessage) {
		//this.log("iframe receiving message:", inMessage);
		this.doMessage(inMessage.data);
	}
});