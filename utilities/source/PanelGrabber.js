enyo.kind({
    name: "aresGrabber",
    classes: "lrightArrow",
    switchGrabberDirection: function(active){
        this.addRemoveClass("lrightArrow", active);
        this.addRemoveClass("lleftArrow", !active);
    }
});