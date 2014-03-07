/*global ilibUtilities */
enyo.kind({
	name: "Ares.SignInErrorPopup",
	kind: "Ares.ErrorPopup", 
	
	create: function() {
		this.inherited(arguments);
		this.$.bottomToolbar.createComponent(
			{name: "signInButton", kind: "onyx.Button", content: ilibUtilities("Sign In"), owner: this, ontap: "showAccountConfiguration"}
		);
	}, 
	
	/**
	 * @private
	 */
	showAccountConfiguration: function() {
		this.bubble("onSignInError");
	}
});