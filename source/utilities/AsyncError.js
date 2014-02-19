/**
	_AsyncError_ is a way to notify about errors when a Async object is expected.

	As _enyo.Async_, _AsyncError_ is an **Object**, not a **Component**; thus, you may not declare
	an _AsyncError_ in a _components_ block.

	An AsyncError object represents a task that has not yet completed but will always complete
	in error.

	You may attach callback functions to an AsyncError, to be called when the task completes with
	the error message passed in the constructor.
*/
enyo.kind({
	name: "AsyncError",
	kind: "enyo.Async",
	constructor: function(msg) {
		this.inherited(arguments);
		this.msg = msg;
		this.go();
	},
	go: function() {
		enyo.asyncMethod(this, function() {
			this.fail(this.msg);
		});
		return this;
	}
});