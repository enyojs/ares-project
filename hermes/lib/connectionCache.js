/* global console, module  */
module.exports = {
	timeToLive: 5000,
	sweepInterval: 10000,
	cache: {
	},
	get: function(inKey) {
		console.log("cache: looking for [" + inKey + "]");
		var record = this.cache[inKey] || {};
		if (record.connection) {
			console.log("cache: [recycling]");
		}
		this.touch(record);
		return record.connection;
	},
	extract: function(inKey) {
		var connection = this.get(inKey);
		if (connection) {
			console.log("cache: [extracting]");
			delete this.cache[inKey];
		}
		return connection;
	},
	set: function(inKey, inConnection) {
		// should never happen
		if (!inConnection) {
			console.warn("cache: connection parameter was null for [" + inKey + "]");
			return;
		}
		var old = this.get(inKey);
		if (old && old !== inConnection) {
			console.warn("cache: [deduping]]");
			this.dispose(old);
		}
		var record = {
			connection: inConnection
		};
		this.touch(record);
		this.cache[inKey] = record;
		console.log("cache: caching connection [" + inKey + "]");
		this.sweeper(true);
	},
	touch: function(inRecord) {
		inRecord.expires = new Date().getTime() + this.timeToLive;
	},
	dispose: function(inConnection) {
		if (inConnection.destroy) {
			inConnection.destroy();
		}
	},
	sweep: function() {
		var names = Object.keys(this.cache);
		this.sweeper(!!names.length);
		var now = Date.now();
		for (var i=0, n; (n=names[i]); i++) {
			if (this.cache[n].expires < now) {
				console.log("cache: disposing connection [" + n + "]");
				this.dispose(this.cache[n].connection);
				delete(this.cache[n]);
			}
		}
	},
	sweeper: function(inOnOff) {
		if (this.interval && !inOnOff) {
			console.log("cache: sweeper is OFF");
			clearInterval(this.interval);
			this.interval = null;
		} else if (!this.interval && inOnOff) {
			console.log("cache: sweeper is ON");
			this.interval = setInterval(this.sweep.bind(this), this.sweepInterval);
		}
	}
};
