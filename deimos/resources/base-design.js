Palette.model.push(
	{name: "standard", items: [
		{name: "Container", title: "Simple Container", icon: "box_new.png", stars: 4, version: 2.0, blurb: "Chosen many and hearty, energy, delectable.",
			inline: {Xcontent: "Panel", classes: "well", style: "margin: 0; background-color: #F6F6F6;"},
			config: {content: "$name", isContainer: true, layoutKind: "BaseLayout", classes: "well"}
		},
		{name: "Scroller", title: "Scroller", icon: "box_new.png", stars: 4, version: 2.0, blurb: "Chosen many and hearty, energy, delectable.",
			inline: {style: "background-color: #eee; height: 40px;w width: 98%;"},
			config: {kind: "Scroller", fit: true, isContainer: true}
		},
		{name: "Caption", title: "Caption", icon: "box_white.png", stars: 4, version: 2.0, blurb: "BLBLBLBLB.",
			inline: {tag: "span", content: "Caption"},
			config: {tag: "span", style: "padding: 0 4px; vertical-align: middle;", content: "$name"}
		}
	]}
);

Model.config.push(
	{type: "kind", name: "onyx.RadioGroup",			// TODO: To move to onyx design.js (or .JSON file)
		properties: {
			highlander: {filterLevel: "useful", inputKind: "Inspector.Config.Boolean"},
			content: {filterLevel: "hidden"}
		},
		events: {
			ontap: {filterLevel: "normal"}
		}
	},
	{type: "kind", name: "onyx.Input",				// TODO: To move to onyx design.js (or .JSON file)
		properties: {
			value: {filterLevel: "useful", inputKind: "Inspector.Config.Text"},
			placeholder: {filterLevel: "useful"},
			type: {filterLevel: "useful", inputKind: {kind: "Inspector.Config.Select", values: ["text", "url", "email", "search", "number"]}},
			selectOnFocus: {filterLevel: "useful"}
		},
		events: {
			onchange: {filterLevel: "useful"},
			onDisabledChange: {filterLevel: "useful"}
		}
	}
);

Model.defaults = {
	properties: {
		owner: {filterLevel: "hidden"},
		container: {filterLevel: "hidden"},
		parent: {filterLevel: "hidden"},
		prepend: {filterLevel: "hidden"},
		events: {filterLevel: "hidden"},
		id: {filterLevel: "hidden"},
		isContainer: {filterLevel: "hidden"},
		controlParentName: {filterLevel: "hidden"},
		layoutKind: {filterLevel: "hidden"},
		canGenerate: {filterLevel: "dangerous", inputKind: "Inspector.Config.Boolean"},
		content: {filterLevel: "useful", inputKind: "Inspector.Config.Text"},
		name: {filterLevel: "useful", inputKind: "Inspector.Config.Text"}
	},
	events: {
		ontap: {filterLevel: "useful"}
	}
};

Model.buildInformation();