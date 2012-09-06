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
		/*
		{name: "Rows", title: "Vertical stacked layout", icon: "package_new.png", stars: 4.5, version: 2.0, blurb: "Stack of vertical rows, one of which can be made to fit.",
			inline: {kind: "Rows", style: "height: 80px; position: relative;", padding: 4, components: [
				{style: "background-color: lightblue; border: 1px dotted blue; height: 15px;"},
				{style: "background-color: lightblue; border: 1px dotted blue;", fit: true},
				{style: "background-color: lightblue; border: 1px dotted blue; height: 15px;"}
			]},
			config: {content: "$name", isContainer: true, kind: "Rows", padding: 10, margin: 10}
		},
		{name: "Columns", title: "Horizontal stacked layout", icon: "package_new.png", stars: 4.5, version: 2.0, blurb: "Stack of horizontal columns, one of which can be made to fit.",
			inline: {kind: "Columns", style: "height: 60px; position: relative;", padding: 4, components: [
				{style: "background-color: lightblue; border: 1px dotted blue; width: 20px;"},
				{style: "background-color: lightblue; border: 1px dotted blue;", fit: true},
				{style: "background-color: lightblue; border: 1px dotted blue; width: 20px;"}
			]},
			config: {content: "$name", isContainer: true, kind: "Columns", padding: 10, margin: 10}
		},
		*/
		{name: "Caption", title: "Caption", icon: "box_white.png", stars: 4, version: 2.0, blurb: "BLBLBLBLB.",
			inline: {tag: "span", content: "Caption"},
			config: {tag: "span", style: "padding: 0 4px; vertical-align: middle;", content: "$name"}
		}
	]}
);