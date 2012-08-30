enyo.kind({
	name: "ServiceRegistry",
	kind: enyo.Component,
	events: {
		onServicesChange: ""
	},
	components: [
		{kind: "Signals", onReloadServices: "reloadServices"},
		{name: "errorPopup", kind: "onyx.Popup", modal: true, centered: true, floating: true, components: [
			{tag: "h3", content: "Oh, no!"},
			{content: "Ares IDE Server returned an error"}
		]}
	],
	published: {
		services: [],
		loaded: false
	},
	listServices: function(inType) {
		if (this.loaded) {
			this._doServicesChange();
		} else {
			this.reloadServices();
		}
	},
	reloadServices: function() {
		var origin = window.location.origin || window.location.protocol + "//" + window.location.host; // Webkit/FF vs IE
		var url = origin + '/res/services';
		new enyo.Ajax({url: url, handleAs: 'json'})
			.response(this, function(inSender, inValue) {
				//this.log("Response: '"+JSON.stringify(inValue)+"'");
				if (inValue) {
					if (inValue.services && inValue.services[0]) {
						this.services = inValue.services.filter(function(service){
							return service.active;
						});
						this._doServicesChange();
					}
				} else {
					this._handleReloadError("Empty response from Ares IDE Server");
				}
			})
			.error(this, function(err){
				this._handleReloadError(err);
			})
			.go();
		//this.log("Request");
	},
	//* @private
	_handleReloadError: function(err) {
		this.$.errorPopup.show();
		this.error("Error: "+JSON.stringify(err));
	},
	//* @private
	_doServicesChange: function() {
		//this.log("TX: onServicesChange");
		this.doServicesChange(this.services);
	}
});
