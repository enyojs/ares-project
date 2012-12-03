enyo.kind({
	name: "DocumentToolbar",
	kind: "onyx.MoreToolbar",
	components: [
		{kind: "onyx.Grabber", ontap: "toggleFiles"},
	],
	documents: [],
});
