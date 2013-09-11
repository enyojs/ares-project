/* global async, ares */

/**
 * Manages the content of 'package.js' files
 * 
 * @class Ares.PackageMunger
 * @augments enyo.Component
 */
enyo.kind({
	name: "Ares.PackageMunger",
	kind: "enyo.Component",
	debug: false,
	events: {
		onChangingNode: ""
	},
	create: function() {
		ares.setupTraceLogger(this);		// Setup this.trace() function according to this.debug value
		this.inherited(arguments);
	},
	/**
	 * Handle a sequence of nodes addition and removal
	 */
	changeNodes: function(inOps, next) {
		var tasks = [], fn;
		// Build a list of tasks to be executed one by one by
		// async.  The key name is expected to be a function
		// name available in Ares.PackageMunger
		for (var key in inOps) {
			fn = '_' + key + 'Node';
			if (typeof this[fn] === 'function') {
				tasks.push(this[fn].bind(this, inOps[key]));
			}
		}
		async.series(tasks, next);
	},
	/**
	 * Add the given file or folder (if relevant) to the given package.js
	 * 
	 * @param {Object} inParam
	 * @property inParam {Ares.FileSytemService} service
	 * @property inParam {com.enyojs.ares.fs.node} parentNode the containg folder node
	 * @property inParam {com.enyojs.ares.fs.node} pkgNode the package.js file node (my be falsy if not defined)
	 * @property inParam {com.enyojs.ares.fs.node} node the node of the file/folder to be added
	 * @param {Function} next common-JS callback
	 * @private
	 */
	_addNode: function(inParam, next) {
		this.trace("inParam:", inParam);
		if (!this._isHandledInPackage(inParam)) {
			this.trace('skipped:', inParam.node.name, 'is not handled by package.js');
			next();
			return;
		}
		async.waterfall([
			this._packageCreate.bind(this, inParam.service, inParam.parentNode, inParam.pkgNode),
			this._packageRead.bind(this, inParam.service),
			this._packageAppend.bind(this, inParam.node.name),
			this._packageSave.bind(this, inParam.service),
			this._packageCheckNode.bind(this, inParam.service, inParam.node /*parentNode*/),
			this._packageCreate.bind(this, inParam.service, inParam.node /*parentNode*/)
		], next);
	},
	/**
	 * Remove the given file or folder (if relevant) from the given package.js
	 * 
	 * @param {Object} inParam
	 * @property inParam {Ares.FileSytemService} service
	 * @property inParam {com.enyojs.ares.fs.node} parentNode the containg folder node
	 * @property inParam {com.enyojs.ares.fs.node} pkgNode the package.js file node (my be falsy if not defined)
	 * @property inParam {com.enyojs.ares.fs.node} node the node of the file/folder to be added
	 * @param {Function} next common-JS callback
	 * @private
	 */
	_removeNode: function(inParam, next) {
		this.trace("inParam:", inParam);
		if (!this._isHandledInPackage(inParam)) {
			this.trace('skipped:', inParam.node.name, 'is not handled by package.js');
			next();
			return;
		}
		async.waterfall([
			this._packageCreate.bind(this, inParam.service, inParam.parentNode, inParam.pkgNode),
			this._packageRead.bind(this, inParam.service),
			this._packageChop.bind(this, inParam.node.name),
			this._packageSave.bind(this, inParam.service)
		], next);
	},
	/** @private */
	_isHandledInPackage: function(inParam) {
		return inParam.node.isDir ||
			(inParam.node.name.match(/\.(js|css)$/i) &&
			 inParam.node.name !== "package.js");
	},
	/** @private */
	_packageCheckNode: function(service, parentNode, pkgNode, next) {
		this.trace("parentNode:", parentNode, "pkgNode:", pkgNode);
		if (pkgNode) {
			next(null, pkgNode);
		} else if (parentNode.isDir) {
			service.propfind(parentNode.id, 1 /*depth*/)
				.response(this, function(inRequest, inData) {
					this.trace("PackageMunger._packageCheckNode(): inRequest:", inRequest, "inData:", inData);
					var nodes = inData && inData.children;
					pkgNode = nodes && enyo.filter(nodes, function(node) {
						return node.name === 'package.js';
					})[0];
					next(null, pkgNode);
				})
				.error(this, function(inRequest, inError) {
					this.trace("PackageMunger._packageCheckNode(): inRequest:", inRequest, "inError:", inError);
					next(inError);
				});
		} else {
			this.trace("no pkgNode & parentNode is not a folder: nothing to do");
			next(null, null);
		}
	},
	/** @private */
	_packageCreate: function(service, parentNode, pkgNode, next) {
		this.trace("parentNode:", parentNode, "pkgNode:", pkgNode);
		if (pkgNode) {
			next(null, pkgNode);
		} else if (parentNode.isDir) {
			service.createFile(parentNode.id, "package.js", "enyo.depends(\n);\n")
				.response(this, function(inRequest, inFsNode) {
					this.trace("PackageMunger._packageCreate(): package.js inFsNode[0]:", inFsNode[0]);
					next(null, inFsNode[0]);
				})
				.error(this, function(inRequest, inError) {
					this.trace("PackageMunger._packageCreate(): inRequest:", inRequest, "inError:", inError);
					next(inError);
				});
		} else {
			this.trace("no pkgNode & parentNode is not a folder: nothing to do");
			next();
		}
	},
	/** @private */
	_packageRead: function(service, pkgNode, next) {
		this.trace("pkgNode:", pkgNode);
		service.getFile(pkgNode.id)
			.response(this, function(inSender, inContent) {
				next(null, pkgNode, inContent.content);
			});
	},
	/** @private */
	_packageAppend: function(name, pkgNode, pkgContent, next) {
		this.trace("name:", name, "pkgContent:", pkgContent);
		var toMatch = name.replace(/\./, "\\."); // replace '.' with '\.'
		var re = new RegExp("\\b" + toMatch + "\\b");
		var newContent;
		if (pkgContent.match(re)) {
			this.trace('file ', name, ' is already in package.js');
		} else {
			this.trace('inserting ', name, 'in package.js');
			newContent = pkgContent
				.replace(/\)/,'\t"' + name + '"\n)') // insert new name
				.replace(/("|')(\s*)"/,'$1,$2"');    // add potentially missing comma
		}
		if (newContent === pkgContent) {
			newContent = null;
		} else {
			this.doChangingNode({node: pkgNode});
		}
		next(null, pkgNode, newContent);
	},
	/** @private */
	_packageChop: function(name, pkgNode, pkgContent, next) {
		this.trace("name:", name, "pkgContent:", pkgContent);
		var toMatch = name.replace(/\./, "\\."); // replace '.' with '\.'
		this.trace('regexp toMatch:', toMatch);
		var re = new RegExp("(\"|')" + toMatch + "(\"|')");
		var newContent;
		if (pkgContent.match(re)) {
			newContent = pkgContent
				.replace(re,'')            // remove name
				.replace(/,\s*,/,",")      // remove duplicated comma
				.replace(/\(\s*,/,"(")     // remove comma after '('
				.replace(/,\s*\)/,"\n)")   // remove comma before ')'
				.replace(/\(\s*\)/,"(\n)"); // remove blank line between ( )
		} else  {
			this.trace('cannot find ', name, ' in package.js');
		}
		if (newContent === pkgContent) {
			newContent = null;
		} else {
			this.doChangingNode({node: pkgNode});
		}
		next(null, pkgNode, newContent);
	},
	/** @private */
	_packageSave: function(service, pkgNode, pkgContent, next) {
		this.trace("pkgNode:", pkgNode, "pkgContent:", pkgContent);
		if (pkgContent) {
			service.putFile(pkgNode.id, pkgContent)
				.response(this, function(inRequest, inFsNode) {
					this.trace("PackageMunger._packageSave(): updated package.js in inFsNode:", inFsNode[0]);
					next(null, null);
				})
				.error(this, function (inRequest, inError) {
					this.trace("PackageMunger._packageSave(): inRequest:", inRequest, "inError:", inError);
					next(inError);
				});
		} else {
			next(null, null);
		}
	}
});
