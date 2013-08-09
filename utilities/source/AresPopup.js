enyo.kind({
    name: "Ares.AresPopup",
    kind: "onyx.Popup",
    handlers: {
        ondragstart: "dragstart",
        ondrag: "drag"
    },
    initialPosition: "",
    isDraggable: false,
    draggable: true,
    create: function(inSender, inEvent) {
        this.inherited(arguments);
    },
    resizeHandler: function(inSender, inEvent) {
        this.inherited(arguments);
        var cn = Ares.instance.hasNode();
        this.containerBounds = cn ? {width: cn.clientWidth, height: cn.clientHeight} : {};
    },
    drag: function(inSender, inEvent) {
        if(this.draggable){
            if(this.isDraggable) {
                var leftP = this.isOutOfXDrag(inSender, inEvent); 
                var topP = this.isOutOfYDrag(inSender, inEvent);
                if(leftP !== null){
                    this.applyStyle("left", leftP+"px");
                } else {
                    this.applyStyle("left", (this.initialPosition.left+inEvent.dx)+"px");
                }
                if(topP !== null){
                    this.applyStyle("top", topP+"px");
                } else {
                    this.applyStyle("top", (this.initialPosition.top+inEvent.dy)+"px");
                }                 
            } 
        }  
        return true;
    },
    dragstart: function(inSender, inEvent) {
        if(this.draggable){
            this.initialPosition = this.getBounds();
            this.isDraggable = this.isInDraggable(inSender, inEvent);
        }
        return true;
    },
    isInDraggable: function(inSender, inEvent) {
        var px, pY, minX, minY, maxX, maxY;
        pX = inEvent.clientX;
        pY = inEvent.clientY;
        minX = this.initialPosition.left;
        minY = this.initialPosition.top;
        maxX = minX + this.initialPosition.width;
        maxY = minY + this.initialPosition.height;
        return (pX >= minX && pX <= maxX && pY >= minY && pY <= maxY);
    },
    isOutOfXDrag:function(inSender, inEvent) {
        var xPosition = null;
        var e = inEvent;
        var leftP = this.initialPosition.left + e.dx;
        var topP = this.initialPosition.left + e.dy;
        if(leftP < 0){
            xPosition = 0;
        } else if(this.containerBounds.width < (leftP+this.initialPosition.width)){
            xPosition = this.containerBounds.width - this.initialPosition.width; 
        }
       return xPosition;
    },
    isOutOfYDrag:function(inSender, inEvent) {
        var yPosition = null;
        var e = inEvent;
        var topP = this.initialPosition.top + e.dy;
        if(topP < 0){
            yPosition = 0;
        } else if(this.containerBounds.height < (topP+this.initialPosition.height)){
            yPosition = this.containerBounds.height - this.initialPosition.height; 
        }
        return yPosition;
    }
})
