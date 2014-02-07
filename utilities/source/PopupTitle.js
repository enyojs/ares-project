enyo.kind({
	name: "Ares.PopupTitle",
	handlers: {
		ondragstart: "_dragstartAction",
		ondragend: "_dragendAction",
		ondrag: "_dragAction"
	},
	/** @private */
	_initialPosition: "",
	/** @private */
	_isDragging: false,
	published: {
		draggable: true
	},
	create: function(inSender, inEvent) {
		this.inherited(arguments);
	},
	resizeHandler: function(inSender, inEvent) {
		this.inherited(arguments);
		if (Ares.instance && Ares.instance.hasNode()) {
			var cn = Ares.instance.hasNode();
			this.containerBounds = cn ? {width: cn.clientWidth, height: cn.clientHeight} : {};
		} else {
			this.containerBounds = {};
		}
	},
	/** @private */
	_dragAction: function(inSender, inEvent) {
		if(this.draggable && this._isDragging) {
			var leftP = this._isOutOfXDrag(inSender, inEvent);
			var topP = this._isOutOfYDrag(inSender, inEvent);
			if(leftP !== null){
				this.container.applyStyle("left", leftP+"px");
			} else {
				this.container.applyStyle("left", (this._initialPosition.left+inEvent.dx)+"px");
			}
			if(topP !== null){
				this.container.applyStyle("top", topP+"px");
			} else {
				this.container.applyStyle("top", (this._initialPosition.top+inEvent.dy)+"px");
			}
		}
		return true;
	},
	/** @private */
	_dragstartAction: function(inSender, inEvent) {
		if(this.draggable){
			this._initialPosition = this.container.getBounds();
			this._isDragging = this._isInDraggable(inSender, inEvent);
		}
		return true;
	},
	/** @private */
	_dragendAction: function(inSender, inEvent) {
		if(this.draggable){
			this._isDragging = false;
		}
		return true;
	},
	/** @private */
	_isInDraggable: function(inSender, inEvent) {
		var pX, pY, minX, minY, maxX, maxY;
		pX = inEvent.clientX;
		pY = inEvent.clientY;
		minX = this._initialPosition.left;
		minY = this._initialPosition.top;
		maxX = minX + this._initialPosition.width;
		maxY = minY + this._initialPosition.height;
		return (pX >= minX && pX <= maxX && pY >= minY && pY <= maxY);
	},
	/** @private */
	_isOutOfXDrag:function(inSender, inEvent) {
		var xPosition = null;
		var e = inEvent;
		var leftP = this._initialPosition.left + e.dx;
		if(leftP < 0){
			xPosition = 0;
		} else if(this.containerBounds.width < (leftP+this._initialPosition.width)){
			xPosition = this.containerBounds.width - this._initialPosition.width;
		}
		return xPosition;
	},
	/** @private */
	_isOutOfYDrag:function(inSender, inEvent) {
		var yPosition = null;
		var e = inEvent;
		var topP = this._initialPosition.top + e.dy;
		if(topP < 0){
			yPosition = 0;
		} else if(this.containerBounds.height < (topP+this._initialPosition.height)){
			yPosition = this.containerBounds.height - this._initialPosition.height;
		}
		return yPosition;
	}
});

