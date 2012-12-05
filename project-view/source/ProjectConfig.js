/**
 * This kind holds the consistency between the project.json and the
 * in-memory representation of the project configuration.
 *
 * After creation of the kind, use #init(service, folderId) to
 * set the location of the project.  Those values can no longer be
 * changed.
 *
 * - Use #setData and #getData to change the in-memory configuration Javascript object.
 *   data is an object containing the *whole* configuration.
 * - Then use #save to send the whole configuration to remote storage
 *
 * As it is, this kind performs zero checks on the content of the file.
 */
enyo.kind({
	name: "ProjectConfig",
	kind: "enyo.Object",
	published: {
		data: {}
	},
	service: null,		// filesystem service
	folderId: null,
	fileId: null,
	debug: false,
	create: function() {
		this.inherited(arguments);
	},
	/**
	 * Initializer: load data from project.json file
	 * @param {Object} inLocation gives information to access project.json
	 *  (expects { service: <object>, folderId: <string>)} )
	 * @param {Object} next is a CommonJS callback
	 */
	init: function(inLocation, next) {
		this.data = null;
		this.service = inLocation.service;
		this.folderId = inLocation.folderId;
		var req = this.service.propfind(this.folderId, 1);
		req.response(this, function(inSender, inResponse) {
			var prj = inResponse.children.filter(function(node){
				return node.name === "project.json";
			});
			if (prj.length === 0) {
				// does not exist: create & save it immediatelly
				this.setData(ProjectConfig.checkConfig());
				// Use the folder name by default for the project name
				this.data.name = inResponse.name;
				this.save(next);
			} else {
				// already exists: load it
				this.fileId = prj[0].id;
				this.load(next);
			}
		});
		req.error(this, function(inSender, inError){
			enyo.error("ProjectConfig.init:", inError);
			if (next instanceof Function) next(inError);
		});
	},
	/**
	 * Force reloading the configuration from the storage
	 * @param {Function} next CommonJS callback
	 */
	load: function(next) {
		var data,
		    req = this.service.getFile(this.fileId);
		req.response(this, function(inRequest, inResponse) {
			if (this.debug) this.log("ProjectConfig.load: file=", inResponse);
			if (typeof inResponse.content === 'string') {
				try {
					data = JSON.parse(inResponse.content);
				} catch(e) {
					enyo.error("ProjectConfig.load:", e);
					inRequest.fail(e);
				}
			} else {
				data = inResponse.content;
			}
			this.data = ProjectConfig.checkConfig(data);
			if (this.debug) this.log("ProjectConfig.load config=", this.data);
			if (next instanceof Function) next();
		});
		req.error(this, function(inSender, inError) {
			this.error("ProjectConfig.load:", inError);
			if (next instanceof Function) next(inError);
		});
	},
	/**
	 * Save the current configuration to storage
	 * @param {Function} next CommonJS callback
	 */
	save: function(next) {
		var req;
		if (this.debug) this.log("data=", this.data);
		if (this.fileId) {
			req = this.service.putFile(this.fileId, JSON.stringify(this.data));
		} else {
			req = this.service.createFile(this.folderId, "project.json", JSON.stringify(this.data));
		}
		req.response(this, function(inSender, inResponse) {
			if (this.debug) enyo.log("ProjectConfig.save: inResponse=", inResponse);
			this.fileId = inResponse.id;
			if (next instanceof Function) next();
		});
		req.error(this, function(inSender, inError) {
			enyo.error("ProjectConfig.save: error=", inError);
			if (next instanceof Function) next(inError);
		});
	},
	/**
	 * Generate PhoneGap's config.xml on the fly
	 *
	 * @return {String} or undefined if PhoneGap build is disabled
	 * for this project
	 */
	getPhoneGapConfigXml: function() {
		var phonegap = this.data.build.phonegap;
		if (!phonegap) {
			this.log("PhoneGap build disabled: will not generate the XML");
			return undefined;
		}

		// See http://flesler.blogspot.fr/2008/03/xmlwriter-for-javascript.html

		var str, xw = new XMLWriter('UTF-8');
		xw.indentation = 4;
		xw.writeStartDocument();

		xw.writeStartElement( 'widget' );
		xw.writeComment('*** This is an automatically generated document.' +
				' Do not edit it: your changes would be automatically overwritten **');

		xw.writeAttributeString('xmlns','http://www.w3.org/ns/widgets');
		xw.writeAttributeString('xmlns:gap','http://phonegap.com/ns/1.0');

		xw.writeAttributeString('id', this.data.id);
		xw.writeAttributeString('version',this.data.version);

		// we use 'title' (one-line description) here because
		// 'name' is made to be used by package names
		xw.writeElementString('name', this.data.title);

		// we have no multi-line 'description' of the
		// application, so use our one-line description
		xw.writeElementString('description', this.data.title);

		xw.writeStartElement( 'icon' );
		// If the project does not define an icon, use Enyo's
		// one
		xw.writeAttributeString('src', phonegap.icon.src || 'icon.png');
		xw.writeAttributeString('role', phonegap.icon.role || 'default');
		xw.writeEndElement();	// icon

		xw.writeStartElement( 'author' );
		xw.writeAttributeString('href', this.data.author.href);
		xw.writeString(this.data.author.name);
		xw.writeEndElement();	// author

		// skip completelly the 'platforms' tags if we target
		// all of them
		if (phonegap.targets && (enyo.keys(phonegap.targets).length > 0)) {
			xw.writeStartElement('platforms', 'gap');
			for (var platformName in phonegap.targets) {
				var platform = phonegap.targets[platformName];
				xw.writeStartElement('platform', 'gap');
				xw.writeAttributeString('name', platformName);
				for (var propName in platform) {
					xw.writeAttributeString(propName, platform[propName]);
				}
				xw.writeEndElement(); // gap:platform
			}
			xw.writeEndElement();	// gap:platforms
		}

		// UI should be helpful to define the features so that
		// the URL's are correct... I am not sure whether it
		// is possible to have them enforced by a JSON schema,
		// unless we hard-code a discrete list of URL's...
		enyo.forEach(phonegap.features, function(feature) {
			xw.writeStartElement('feature');
			xw.writeAttributeString('name', feature.name);
			xw.writeEndElement(); // feature
		}, this);

		// ...same for preferences
		for (var prefName in phonegap.preferences) {
			xw.writeStartElement('preference');
			xw.writeAttributeString('name', prefName);
			xw.writeAttributeString('value', phonegap.preferences[prefName]);
			xw.writeEndElement(); // preference
		}

		xw.writeEndElement();	// widget

		//xw.writeEndDocument(); called by flush()
		str = xw.flush();
		xw.close();
		if (this.debug) this.log("xml:", str);
		return str;
	},
	statics: {
		checkConfig: function(inConfig) {
			var config = ares.clone(ProjectConfig.DEFAULT_PROJECT_CONFIG);
			ares.extend(config, inConfig);
			return config;
		},

		// used to pre-fill properties of a new project
		// contains default values
		PREFILLED_CONFIG_FOR_UI: {
			build: {
				phonegap: {
					enabled: false,
					icon: {
						src: "icon.png",
						role: "default"
					},
					preferences: {
						"phonegap-version": "2.0.0"
					}
				}
			}
		},

		// FIXME: the below should be replaced by proper JSON
		// schema validation with default values.
		DEFAULT_PROJECT_CONFIG: {
			id: "com.examples.apps.myapp",
			name: "BUG IF YOU SEE THIS",
			version: "0.0.1",
			title: "Example: My Application",
			description: "Description of My Application",
			author: {
				name: "An Example Company",
				href: "http://www.example.com"
			},
			build: {
				phonegap: {
					enabled: true,
					icon: {
						src: "icon.png",
						role: "default"
					},
					preferences: {
						"phonegap-version": "2.0.0"
					}
				}
			}
		}
	}
});
