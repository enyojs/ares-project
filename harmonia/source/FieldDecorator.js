enyo.kind({
	name: "FieldDecorator", 
	kind: "ToolDecorator",
	published: {
		title: "Field"
	},
	style: "margin: 0 32px 8px 0; vertical-align: top;",
	components: [
		{name: "label", tag: "label", style: "xborder: 1px solid lightblue;", components: [
			{name: "title", content: "Field", style: "font-size: 14px; font-style: italic; font-weight: bold; padding-bottom: 8px; padding-left: 0; color: #555;"},
			{name: "subtitle", style: "font-size: 12px; font-style: italic; padding-bottom: 8px; padding-left: 0; color: #555;", showing: false},
			//{kind: "ToolDecorator", classes: "onyx-input-decorator", components: [
			{name: "client", tag: null}
			//]}//,
			//{name: "validation", style: "font-size: small; font-style: italic; padding: 8px; padding-left: 0; color: red;", allowHtml: true, content: "&nbsp;"}
		]}
	],
	create: function() {
		this.inherited(arguments);
		this.titleChanged();
		this.subtitleChanged();
	},
	titleChanged: function() {
		this.$.title.setContent(this.title);
	},
	subtitleChanged: function() {
		this.$.subtitle.setShowing(Boolean(this.subtitle));
		this.$.subtitle.setContent(this.subtitle);
	}
});