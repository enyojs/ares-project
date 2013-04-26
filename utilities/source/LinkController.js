enyo.kind({
    name: "control.Link",
    kind: "enyo.Control",
    handlers: {
        onmouseover: "navOver",
        onmouseout: "navOut",
        onmousedown: "navPress",
        onmouseup: "navDePress"
    },
    constructor: function(){
        this.inherited(arguments);
    },
    navOver: function(item) {
        this.addClass('hover');
    },
    navOut: function(item) {
        this.removeClass('hover');
        this.removeClass('active');
    },
    navPress: function(item) {
        this.addClass('active');
    },
    navDePress: function(item) {
        this.removeClass('active');
    }
});
