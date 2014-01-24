/*global ProjectKindsModel, ares, enyo, setTimeout, StateMachine */

enyo.kind({
	name: "Designer",
	published: {
		designerFrameReady: false,
		height: null,
		width: null,
		currentFileName: "",
		autoZoom: false
	},
	events: {
		onSelect: "",
		onSelected: "",
		onCreateItem: "",
		onMoveItem: "",
		onSyncDropTargetHighlighting: "",
		onReloadComplete: "",
		onResizeItem: "",
		onError: "",
		onReturnPositionValue: "",
		onForceCloseDesigner: "",
		onScaleChange: ""
	},
	components: [
		{name: "designerFrame", tag: "iframe", classes: "ares-designer-frame-client"},
		{name: "communicator", kind: "RPCCommunicator", onMessage: "receiveMessage"}
	],
	baseSource: "designerFrame.html",
	projectSource: null,
	selection: null, // extensively (and directly) used by Deimos
	reloadNeeded: false,
	scale: 1,
	debug: false,

	fsm: null,
	fsmStruct: {
		initial: 'off',
		events: [
			// start designer
			{name: 'projectSelected', from: ['off','ready','broken'], to: 'reloading'},
			{name: 'dfLoaded',        from: 'reloading',     to: 'initializing'},
			{name: 'dfInitialized',   from: 'initializing',  to: 'initialized'},
			{name: 'dfReady',         from: 'initialized',   to: 'ready'},
			{name: 'dfReloadNeeded',  from: 'reloading',     to: 'broken'},

			{name: 'render',          from: 'ready',         to: 'rendering'},
			{name: 'dfRendered',      from: 'rendering',     to: 'ready'},
			{name: 'dfRenderError',   from: 'rendering',     to: 'ready'},
			{name: 'dfRequestReload', from: 'rendering',     to: 'off'},

			{name: 'syncFile',        from: ['ready','closed'],  to: 'updating'},
			{name: 'dfRequestReload', from: 'updating',      to: 'off'},
			{name: 'dfUpdated',       from: 'updating',      to: 'ready'},
			{name: 'dfReloadNeeded',  from: 'updating',      to: 'broken'},

			{name: 'select',          from: 'ready',         to: 'selecting'},
			{name: 'dfSelected',      from: 'selecting',     to: 'ready'},
			{name: 'dfSelect',        from: 'ready',         to: 'ready'},

			{name: 'cleanUp',         from: 'ready',         to: 'closed'},

			{name: 'modifyProperty',  from: 'ready',         to: 'rendering'},

			{name: 'render',          from: 'broken',        to: 'reloading'}
		],
		callbacks: {
			onenterstate: function(event, from, to) {
				if (this.trace) {
					this.trace("fsm got event " + event + ' from ' + from + ' to ' + to );
				}
			},
			onleaveoff: function(event, from, to) {
				this.fsmStash = [];
			},
			ondfReady: function(event, from, to) { // pop
				this.execCb();
				if (this.fsmStash.length) {
					var resume = this.fsmStash.shift();
					var that = this;
					var evtName = resume[0];
					var evtNext = this[evtName];
					var evtArgs = resume[1];
					this.trace("resume " + evtName);
					window.setTimeout( function(){ evtNext.apply(that,evtArgs); });
				}
			},
			onprojectSelected: function(event, from, to, inSource, next){
				this.pendingCb = next;
				this.designer._reloadDesignerFrame(inSource);
			},
			ondfLoaded: function(event, from, to) {
				this.designer.designerFrameLoaded();
			},
			ondfInitialized: function(event, from, to) {
				this.designer.sendDesignerFrameContainerData();
			},

			onrender: function(event, from, to, fileName, theKind, inSelectId, next) {
				ares.assertCb(next);
				var df = this.designer;
				if (from === 'broken') {
					// render will be replayed in ready state
					this.fsmStash.push([event, [fileName, theKind, inSelectId, next]]);
					df._reloadDesignerFrame(df.projectSource);
				} else {
					this.pendingCb = next;
					df._renderKind(fileName, theKind, inSelectId);
				}
			},
			ondfRendered: function(event, from, to, msg) {
				this.execCb();
				this.designer._updateKind(msg);
			},

			onsyncFile: function(event, from, to, filename, inCode, next) {
				this.pendingCb = next;
				this.designer._syncFile(filename, inCode);
			},
			ondfUpdated: function(event, from, to) {
				this.execCb();
			},

			onselect: function(event, from, to, inControl) {
				this.designer.sendMessage({op: "select", val: inControl});
			},
			ondfSelected: function(event, from, to, msg) {
				var selection = enyo.json.codify.from(msg.val);
				this.designer.selection = selection;
				this.designer.doSelected({component: selection});
			},
			ondfSelect: function(event, from, to, msg) {
				var selection = enyo.json.codify.from(msg.val);
				this.designer.selection = selection;
				// note the subtle difference: doSelect_ed_ event is sent
				this.designer.doSelect({component: selection});
			},

			onmodifyProperty:  function(event, from, to, inProperty, inValue, next) {
				this.pendingCb = next;
				this.designer.sendMessage({
					op: "modify",
					filename: this.designer.currentFileName,
					val: {property: inProperty, value: inValue}
				});
			},

			oncleanUp: function(event, from, to) {
				this.designer.sendMessage({op: "cleanUp"});
			},

			// error handling
			ondfRequestReload: function(event, from, to, err) {
				var deimos = this.designer.owner;
				err.callback = deimos.closeDesigner.bind(deimos);
				err.action = "Switching back to code editor";
				this.designer.doError(err);
			},
			ondfReloadNeeded: function(event, from, to, err) {
				this.designer.doError(err);
			},
			ondfRenderError: function(event, from, to, err) {
				this.designer.doError(err);
			}
		},
		error: function(eventName,from, to, args, errorCode, errorMessage,error) {
			if (errorCode === 300) {
				// Invalid callback. See state-machine source code for error codes :-/
				throw error || errorMessage ;
			} else if ( /^df/.test(eventName) ) {
				// don't delay event coming from designer frame
				throw ("Unexpected event " + eventName + " coming from designer in state " + from) ;
			} else {
				this.trace("got " + eventName + " while in state " + from +", stashing event");
				this.fsmStash.push([eventName, args]);
			}
		}
	},

	create: function() {
		ares.setupTraceLogger(this);
		var fsm = StateMachine.create( this.fsmStruct );
		fsm.trace = this.trace.bind(this);
		fsm.execCb = (function() {
			var cb = this.pendingCb;
			this.pendingCb = null;
			cb();
		}).bind(fsm);
		fsm.designer = this ;
		this.fsm = fsm;

		this.inherited(arguments);
	},
	rendered: function() {
		this.inherited(arguments);
		this.$.communicator.setRemote(this.$.designerFrame.hasNode().contentWindow);
	},
	heightChanged: function() {
		this.$.designerFrame.applyStyle("height", this.getHeight()+"px");
		this.resizeDesignerFrame();
		this.repositionDesignerFrame();
	},
	widthChanged: function() {
		this.$.designerFrame.applyStyle("width", this.getWidth()+"px");
		this.resizeDesignerFrame();
		this.repositionDesignerFrame();
		this.applyZoom();
	},
	zoom: function(inScale) {
		this.scale = (inScale >= 0) ? Math.max(inScale / 100, 0.2) : 1;
		enyo.dom.transformValue(this.$.designerFrame, "scale", this.scale);
		this.$.designerFrame.resized();
		this.repositionDesignerFrame();
	},
	zoomFromWidth: function(){
		var scale = (this.width > 0) ? Math.round((this.getBounds().width * 100)/this.width) : 100;
		this.zoom(scale);
		return scale;
	},
	applyZoom: function(){
		if(this.autoZoom){
			var scale = this.zoomFromWidth();
			this.doScaleChange({scale : scale});
		}
	},
	resizeHandler: function(inSender, inEvent){
		this.applyZoom();
		return true;
	},
	repositionDesignerFrame: function() {
		var height = this.getHeight(),
			width = this.getWidth(),
			scaledHeight = height * this.scale,
			scaledWidth =  width  * this.scale,
			y = -1*(height - scaledHeight)/2,
			x = -1*(width  - scaledWidth)/2;
		
		this.$.designerFrame.addStyles("top: " + y + "px; left: " + x + "px");
	},
	
	/**
	 * Reload designerFrame and update current source from all project files loaded in Ares.
	 * @param {Ares.Model.Project} inSource is a backbone object defined in WorkspaceData.js
	 * @param {Function} next
	 */
	updateSource: function(inSource, next) {
		ares.assertCb(next);
		this.fsm.projectSelected(inSource,next);
	},

	_reloadDesignerFrame: function(inSource) {
		// called by fsm
		var serviceConfig = inSource.getService().config;
		this.setDesignerFrameReady(false);
		this.projectSource = inSource;
		this.projectPath = serviceConfig.origin + serviceConfig.pathname + "/file";
		var iframeUrl = this.projectSource.getProjectUrl() + "/" + this.baseSource + "?overlay=designer";
		this.trace("Setting designerFrame url: ", iframeUrl);
		this.$.designerFrame.hasNode().src = iframeUrl;
	},

	reload: function() {
		this.trace("reload requested by user");
		this.updateSource(this.projectSource, this.doReloadComplete.bind(this) );
	},
	
	//* Send message via communicator
	sendMessage: function(inMessage) {
		this.trace("Op: ", inMessage.op, inMessage);
		this.$.communicator.sendMessage(inMessage);
	},
	//* Respond to message from communicator
	receiveMessage: function(inSender, inEvent) {
		
		var msg = inEvent.message;
		var err;

		this.trace("Op: ", msg.op, msg);

		if(!msg || !msg.op) {
			enyo.warn("Deimos designer received invalid message data:", msg);
			return;
		}
		
		if(msg.op === "state" && msg.val === "initialized") {
			// designerFrame is initialized and ready to do work.
			// reply op: "containerData"
			this.fsm.dfInitialized();
		} else if(msg.op === "state" && msg.val === "ready") {
			// designerFrame received container data, no reply
			this.setDesignerFrameReady(true);
			this.fsm.dfReady();
		} else if(msg.op === "state" && msg.val === "loaded") {
			// Loaded event sent from designerFrame and awaiting aresOptions.
			// reply op: "initializeOptions"
			this.fsm.dfLoaded();
		} else if(msg.op === "rendered") {
			// The current kind was successfully rendered in the iframe, no reply
			this.fsm.dfRendered(msg);
		} else if(msg.op === "selected") {
			// Select event sent from here was completed successfully. no reply
			this.fsm.dfSelected(msg);
		} else if(msg.op === "select") {
			// New select event triggered in designerFrame. no reply
			this.fsm.dfSelect(msg);
		} else if(msg.op === "syncDropTargetHighlighting") {
			// Highlight drop target in inspector to mimic what's
			// happening in designerFrame, no reply
			this.doSyncDropTargetHighlighting({component: enyo.json.codify.from(msg.val)});
		} else if(msg.op === "createItem") {
			// New component dropped in designerFrame
			// reply op:render (or do a complete reload) after a detour through deimos
			this.doCreateItem(msg.val);
		} else if(msg.op === "moveItem") {
			// Existing component dropped in designerFrame
			// reply op:render (or do a complete reload) after a detour through deimos
			this.doMoveItem(msg.val);
		} else if (msg.op === "updated") {
			// code was updated live in designerFrame
			this.fsm.dfUpdated();
		} else if(msg.op === "error") {
			// no reply

			err = { msg: msg.val.msg, err: msg.val.err } ;

			if (msg.val.requestReload === true) {
				this.fsm.dfRequestReload(err);
			} else if (msg.val.reloadNeeded === true) {
				this.fsm.dfReloadNeeded(err);
				this.reloadNeeded = true; // obsolete
			} else if ( msg.val.triggeredByOp === 'render' ) {
				// missing constructor or missing prototype
				this.fsm.dfRenderError(err);
			} else {
				this.log("unexpected error message from designer", msg);
				this.doError(err);
			}
			// TODO: We should store the error into a kind of rotating error log - ENYO-2462
		} else if(msg.op === "resize") {
			// Existing component resized
			// reply op:render (or do a complete reload) after a detour through deimos
			this.doResizeItem(msg.val);
		} else if(msg.op === "returnPositionValue") {
			// Returning requested position value, no reply
			this.doReturnPositionValue(msg.val);
		} else {
			// Default case
			enyo.warn("Deimos designer received unknown message op:", msg);
		}
	},

	/**
	 * Pass _isContainer_ info down to designerFrame, called in fsm
	 */
	sendDesignerFrameContainerData: function() {
		this.sendMessage({op: "containerData", val: ProjectKindsModel.getFlattenedContainerInfo()});
	},

	/**
	 * Tell designerFrame to render a kind
	 * @param {String} fileName
	 * @param {Object} theKind to render
	 * @param {String} inSelectId
	 * @param {Function} next
	 */
	renderKind: function(fileName, theKind, inSelectId,next) {
		ares.assertCb(next);
		if (this.reloadNeeded) {
			this.reloadNeeded = false;
			// trigger a complete reload of designerFrame
			// FIXME: the reason why render was called is then lost
			// should recall renderKind once reload is done
			this.reload();
			this.log("warning: called in state reloadNeeded");
			setTimeout(next(new Error('reload started')), 0);
			return;
		}

		if(!this.getDesignerFrameReady()) {
			// frame is still being reloaded.
			this.log("warning: called in state != ready");
			setTimeout(next(new Error('on-going reload')), 0);
			return;
		}
		
		this.fsm.render(fileName, theKind, inSelectId, next);
	},

	_renderKind: function(fileName, theKind, inSelectId) {
		// called from fsm
		this.currentFileName = fileName;
		var components = [theKind];
		this.sendMessage({
			op: "render",
			filename: fileName,
			val: {
				name: theKind.name,
				components: enyo.json.codify.to(theKind.components),
				componentKinds: enyo.json.codify.to(components),
				selectId: inSelectId
			}
		});
	},
	select: function(inControl) {
		this.fsm.select(inControl);
	},

	/**
	 * Send message to designer frame only if state machine is in
	 * state 'ready'. Otherwise, the message is dropped
	 * @param {} msg
	 */
	sendMessageIfReady: function(msg) {
		if (this.fsm.is('ready')) {
			this.sendMessage(msg);
		}
		else {
			this.trace('dropped msg "' + msg.op + '" while fsm is in state ' + this.fsm.current);
		}
	},

	highlightDropTarget: function(inControl) {
		this.sendMessageIfReady({op: "highlight", val: inControl});
	},
	unHighlightDropTargets: function() {
		this.sendMessageIfReady({op: "unhighlight"});
	},

	/**
	 * Property was modified in Inspector, update designerFrame.
	 * @param {String} inProperty: property name
	 * @param {String} inValue: prop value
	 * @param {Function} next
	 */
	modifyProperty: function(inProperty, inValue, next) {
		ares.assertCb(next);
		this.fsm.modifyProperty(inProperty, inValue, next);
	},

	//* Send message to Deimos with new kind/components from designerFrame
	_updateKind: function(msg) {
		// called by fsm
		this.trace("called by op " + msg.triggeredByOp + " for file " + msg.filename );
		var deimos = this.owner;

		// need to check if the rendered was done for the current file
		if (msg.filename === this.currentFileName) {
			deimos.buildComponentView(msg);
			deimos.updateCodeInEditor(msg.filename); // based on new Component view

		} else {
			this.log("dropped rendered message for stale file ",msg.filename);
		}
	},
	//* Initialize the designerFrame depending on aresOptions
	designerFrameLoaded: function() {
		// called by fsm
		// FIXME: ENYO-3433 : options are hard-coded with
		// defaultKindOptions that are currently known. the whole/real
		// set must be determined indeed.
		this.sendMessage({op: "initializeOptions", options: ProjectKindsModel.get("defaultKindOptions")});
	},
	//* Clean up the designerFrame before closing designer
	cleanUp: function() {
		this.fsm.cleanUp();
	},

	/**
	 * Pass inCode down to the designerFrame (to avoid needing to
	 * reload the iFrame). Typically called to load files modified by
	 * Ace into designerFrame. Also called for each project file when
	 * switching to designer.
	 * @param {String} projectName
	 * @param {String} filename
	 * @param {String} inCode
	 */
	syncFile: function(projectName, filename, inCode, next) {
		ares.assertCb(next);
		// check if the file is indeed part of the current project
		if (projectName === this.projectSource.getName() ){
			this.fsm.syncFile(filename, inCode, next);
		} else {
			var msg = "syncFile aborted: project mismatch. Expected " + this.projectSource.getName()
					  + ' got '+ projectName + ' with file ' + filename;
			var err = new Error(msg);
			setTimeout(function () { next(err);} ,0);
		}
	},

	_syncFile: function (filename, inCode) {
		// called by fsm
		if( /\.css$/i.test(filename) ) {
			// Sync the CSS in inCode with the designerFrame (to avoid needing to reload the iFrame)
			this.sendMessage({op: "cssUpdate", val: {filename: this.projectPath + filename, code: inCode}});
		} else if( /\.js$/i.test(filename) ) {
			this.sendMessage({op: "codeUpdate", val: inCode});
		}
	},

	resizeDesignerFrame: function() {
		this.sendMessageIfReady({op: "resize"});
	},
	//* Prerender simulated drop in designerFrame
	prerenderDrop: function(inTargetId, inBeforeId) {
		this.sendMessageIfReady({op: "prerenderDrop", val: {targetId: inTargetId, beforeId: inBeforeId}});
	},
	//* Request auto-generated position value from designerFrame
	requestPositionValue: function(inProp) {
		this.sendMessageIfReady({op: "requestPositionValue", val: inProp});
	},
	sendSerializerOptions: function(serializerOptions) {
		// not used in the designerFrame, but in serialiser. No need to check fsm state
		this.sendMessage({op: "serializerOptions", val: serializerOptions});	
	},
	sendDragType: function(type) {
		this.sendMessageIfReady({op: "dragStart", val: type});
	}
});
