enyo.kind(
	{
		name: "ares.IFrame",
		kind: 'Control',

		tag: 'iframe',
		attributes: {
			scrolling: 'no',
			width: '600px', // must match the default value provided in Preview
			height: '800px'
		},

		classes: "enyo-border-box",

		//style: " overflow: hidden;",

		published: {
			url: null
		},

		create: function() {
			this.inherited(arguments);
			this.urlChanged();
		},
		urlChanged: function() {
			if(this.url) this.setAttribute('src', this.url);
		},
		setGeometry: function(width, height) {
			this.setAttribute( 'width',  width) ;
			this.setAttribute( 'height', height) ;
		}
	}
);

enyo.kind(
	{
		name: "ares.ScrolledIFrame",
		kind: "Scroller",

		classes: "enyo-border-box",

		components: [
			{
				classes: "ares-preview-device",
				name: "bezel" ,
				ondrag: "handleDrag",

				components: [
					{
						kind: "ares.IFrame",
						name: 'iframe'
					}
				]
			}
		],

		setUrl: function(url) {
			this.$.iframe.setUrl(url);
		},
		setGeometry: function(width, height) {
			this.$.iframe.setGeometry( width, height) ;
			this.resized() ;
		},

		scale: 1 ,
		shiftX: 0,
		shiftY: 0,

		handleDragStart: function(inSender, inEvent) {
			var frame = this.$.iframe.getBounds() ;
			this.startH = frame.height;
			this.startW = frame.width;
		},

		handleDrag: function(inSender, inEvent) {
			this.log(inSender, inEvent) ;
			this.log( 'pageX ' + inEvent.pageX + ' ddx ' + inEvent.ddx );
			this.log( 'pageY ' + inEvent.pageY + ' ddy ' + inEvent.ddy );
			var x0 = this.getBounds().left ;
			var y0 = this.getBounds().top ;
			var frame = this.$.iframe.getBounds() ;
			var coeff = 1;

			var topY = y0 + frame.top * this.scale ;
			var bottomY = y0 + (frame.top + frame.height) * this.scale ;
			var pY = inEvent.pageY ;

			this.log('drag pY ' + pY + ' topY ' + topY + ' bottomY ' + bottomY ) ;

			if (pY < topY ) {
				// in top bar
				//coeff = ( frame.height - 2*inEvent.ddy ) / frame.height ;
				this.shiftY += inEvent.ddy ;
			}
			else if (pY > bottomY) {
				// in bottom bar
				coeff = ( frame.height + inEvent.ddy ) / frame.height ;
				this.shiftY += inEvent.ddy/2 ;
			}
			else if (inEvent.pageY < y0 + frame.left ) {
				// in top bar
			}
			else if (inEvent.pageY > y0 + frame.left + frame.width) {
				// in bottom bar
			}
			// implement using enyo.dom.transformValue
			//if (inEvent.pageY > this.$)

			this.scale *= coeff ;

			if (this.scale > 1) {
				this.scale = 1;
			}

			this.log('scaling to ' + this.scale + ' with coeff ' + coeff + ' shiftY ' + this.shiftY ) ;

			enyo.dom.transform(
				this.$.bezel, {
					"scale": this.scale,
					translate: Math.round(this.shiftX) + "px, " + Math.round(this.shiftY) + "px"
				}
			) ;
			this.resized() ;

		}

	}
);
