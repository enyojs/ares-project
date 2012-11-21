Palette.model.push(
	{name: "standard", items: [
		{name: "Container", title: "Simple Container", icon: "box_new.png", stars: 4, version: 2.0, blurb: "Chosen many and hearty, energy, delectable.",
			inline: {Xcontent: "Panel", classes: "well", style: "margin: 0; background-color: #F6F6F6;"},
			config: {content: "$name", isContainer: true, layoutKind: "BaseLayout", classes: "well"},
			filters: {
				properties: {},
				events: {}
			}
		},
		{name: "Scroller", title: "Scroller", icon: "box_new.png", stars: 4, version: 2.0, blurb: "Chosen many and hearty, energy, delectable.",
			inline: {style: "background-color: #eee; height: 40px;w width: 98%;"},
			config: {kind: "Scroller", fit: true, isContainer: true},
			filters: {
				properties: {},
				events: {}
			}
		},
		{name: "Caption", title: "Caption", icon: "box_white.png", stars: 4, version: 2.0, blurb: "BLBLBLBLB.",
			inline: {tag: "span", content: "Caption"},
			config: {tag: "span", style: "padding: 0 4px; vertical-align: middle;", content: "$name"},
			filters: {
				properties: {},
				events: {}
			}
		}
	]}
);

Model.defaultFilters = {
	properties: {
		alwaysHidden: {owner: 1, container: 1, parent: 1, prepend: 1, events: 1, id: 1, isContainer: 1, controlParentName: 1, layoutKind: 1},
		dangerous: {canGenerate: 1},
		useful: {content: 1, name: 1}
	},
	event: {}
};