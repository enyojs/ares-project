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
		timestamp: 0
	},
	listServices: function(inType) {
		if (this.timestamp === 0) {
			this.reloadServices();
		} else {
			this._doServicesChange();
		}
	},
	reloadServices: function() {
		var origin = window.location.origin || window.location.protocol + "//" + window.location.host; // Webkit/FF vs IE
		var url = origin + '/conf';
		new enyo.Ajax({url: url, handleAs: 'json'})
			.response(this, function(inSender, conf) {
				//this.log("Response: '"+JSON.stringify(conf)+"'");
				if (conf) {
					if (conf.services && conf.services[0] && conf.timestamp > this.timestamp) {
						this.services = conf.services.filter(function(service){
							return service.active;
						});
						this.timestamp = conf.timestamp;
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
