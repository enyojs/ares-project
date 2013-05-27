/**
 * UI: Phonegap pane in the ProjectProperties popup
 * @name Phonegap.ProjectProperties
 */
   
enyo.kind({
	name: "Phonegap.ProjectProperties",
	debug: true,
	published: {
	  config: {},
       
      generalEnabled: "",
      permissionsEnabled: "",
      androidEnabled: "", 
      iosEnabled: "", 
      blackBerryEnabled: "",
      
      /*
        Variable for the Drawer "General".
      */
      version: "2.5.0",
      orientation: "both",
      screenMode: "both",
      
      /*
        Variables for the Drawer "Permissions".
      */
      battery: "",
      camera: "",
      contact: "",
      file: "",
      geolocation: "",
      media: "",
      network:"", 
      notification: "",
      device: "", 
      
      /*
        Variables for the Drawer "Android Specific".
      */
       minSdk: "",
       maxSdk: "",
       installLocation: "",
       splashScreenDuration: "",
       urlTimeOut: "",
       androidDefaultIcon: "",
       ldpiIcon: "",
       mdpiIcon: "",
       hdpiIcon: "",
       xdpiIcon: "",
      
      
      /*
        Variables for the Drawer "IOS Specific".
      */
      webViewBounce: "",
      prerenderedIcon: "",
      openLinkWebView: "",
      statusBarStyle: "",
      detectDataType: "",
      exitOnSuspend: "",
      splashScreenSpinner: "",
      autoHideSplashScreen: "",
      iosIcon: "",
      retinaIcon: "",
      
      /*
        Variables for the Drawer "Black Berry Specific".
      */
      disableCursor: "",
      blackBerryIcon: "",
      iconHoverState: ""
      
	  },
     handlers: {
        onVersionSelected: "versionSelected", 
        onOrientationSelected: "orientationSelected", 
        onScreenModeSelected: "screenModeSelected",
              
        onInstallLocationSelected: "installLocationSelected",
       
        onWebViewBounceSelected: "webViewBounceSelected",
        onPrerenderedIconSelected: "prerenderedIconSelected",
        onOpenLinkWebViewSelected: "openLinkWebViewSelected",
        onStatusBarStyleSelected: "statusBarStyleSelected", 
        onDetectDataTypeSelected: "detectDataTypeSelected",
        onExitOnSuspendSelected: "exitOnSuspendSelected",
        onExitSplashScreenSpinnerSelected: "exitSplashScreenSpinnerSelected",
        onAutoHideSplashScreenSelected: "autoHideSplashScreenSelected",
        
        onDisableCursorSelected: "disableCursorSelected" 
          
    },
	events: {
		onConfigure: ""
	},
	components: [
		{kind: "FittableRows", components: [
			{classes:"ares-row", components :[
				{tag:"label", classes: "ares-label", 
                 content: "PhoneGap App ID:"},
				{kind: "onyx.InputDecorator", components: [
					{kind: "Input", name: "pgConfId",
					 attributes: {title: "unique identifier, assigned by build.phonegap.com"}
					}				]},
				{tag:"label", classes: "ares-label", content: "Icon URL:"},
				{kind: "onyx.InputDecorator", components: [
					{kind: "Input", name: "pgIconUrl",
						attributes: {title: "Relative location of the application icon. Defaults to Enyo icon."}
					}
				]}
			]}
		]},
    
       {name: "targetsRows", kind: "FittableRows", 
        classes: 'ares_projectView_switches'},
        
		

	],
	/**
	 * @private
	 */
	create: function() {
		this.inherited(arguments);
        this.targets = Phonegap.ProjectProperties.platforms;
        enyo.forEach(this.targets, function(target) {
			this.$.targetsRows.createComponent({
				name: target.id,
				classes:"ares-row",
				kind: "Phonegap.ProjectProperties.Target",
				targetId: target.id,
				targetName: target.name,
				enabled: false
			});
		}, this); 
        
 
 
        
        /*
          Create General configuration rows.
        */
       this.createPhonegapVersionRow();
        this.createDeviceOrientationRow(); 
        this.createFullScreenModeRow();    
        
             /*
          Create Permissions rows.
        */
        this.createBatteryPermissionRow();
        this.createCameraPermissionRow();
        this.createContactPermissionRow();
        this.createFilePermissionRow();
        this.createGeolocationRow();
        this.createMediaRow();
        this.createNetworkRow();
        this.createNotificationRow();
        this.createDeviceRow();   
       
        
         /*
           Create Android specific configuration row.
         */
         this.createMinSdkRow();
         this.createMaxSdkRow();
         this.createInstallLocationRow();
         this.createSplashScreenDurationRow();
         this.createUrlTimeOutRow();
         this.createAndroidDefaultIconRow();
         this.createLdpiIconRow();
         this.createMdpiIconRow();
         this.createHdpiIconRow();
         this.createXdpiIconRow(); 
         
         /*
           Create IOS specifc configuration row.
         */
        this.createWebViewBounceRow();
        this.createPrerenderedIconRow();
        this.createOpenLinkWebViewRow();
        this.createStatusBarStyleRow();
        this.createDetectDataTypeRow();
        this.createExitOnSuspendRow();
        this.createSplashScreenSpinner();
        this.createAutoHideSplashScreen();
        this.createIosIcon();   
        
        /*
          Create Black Berry specific configuration row.
        */ 
        this.createDisableCursorRow();
        this.createBlackBerryIconRow();
        this.createIconHoverStateRow();  
    

	},
 
 
 
         createPhonegapVersionRow: function(){
      this.$.targetsRows.$.general.$.targetDrw.createComponent({
       
         name: "VersionChoiceRow",
          kind: "FittableColumns",
          components:  [
      
        
          	{tag: "label", content: "Phonegap version ", 
              style: "width: 13em; margin-left:3em;" },
            {kind: "onyx.PickerDecorator",
                name: "versionPD",
                classes: "my-onyx-picker-decorator",               
                components: [ 
                {kind: "onyx.PickerButton", content: ""},
                {  name:"versions",
                  
                   kind: "onyx.Picker",
                   classes: "my-onyx-picker",
                   handlers: { onSelect: 'selectEvent'
                             },
                  
                  components: [
                  {content: "2.5.0",active: true},
                  {content: "2.3.0"},
                  {content: "2.2.0"},
                  {content: "2.1.0"},
                  {content: "2.0.0"},
                  {content: "1.9.0"},
                  {content: "1.8.1"},
                  {content: "1.7.0"},
                  {content: "1.6.1"},
                  {content: "1.5.0"},
                  {content: "1.4.1"},
                  {content: "1.3.0"},
                  {content: "1.2.0"},
                  {content: "1.1.0"},
                  ],
                  selectEvent: function(inSender, inValue) {
                     this.bubble('onVersionSelected', inValue);
                    
                       }
                  
                  }
               ]}
            ]     
        });                                                    
     },
     createDeviceOrientationRow : function(){
        this.$.targetsRows.$.general.$.targetDrw.createComponent({
        name: "OrientationChoiceRow",
          kind: "FittableColumns",      
          components:  [
      
        
          	{tag: "label", content: "Device orientation", 
              style: "width: 13em; margin-left:3em;"},
            {kind: "onyx.PickerDecorator",
                name: "orientationChoice", 
                onSelect: "orientationSelected", 
                components: [ 
                {kind: "onyx.PickerButton", content: ""},
                {kind: "onyx.Picker",
                  name:"orientations",
                  handlers: { onSelect: 'selectEvent'
                             },
                  components: [
                  {content: "both",active: true},
                  {content: "landscap"},
                  {content: "portrait"}
                  
                  ],
                  selectEvent: function(inSender, inValue) {
                     this.bubble('onOrientationSelected', inValue);
                       }
                }
               ]}
        
            ]}                                          
         );                           
     },
     
    createFullScreenModeRow: function(){
         this.$.targetsRows.$.general.$.targetDrw.createComponent({
          name: "FullScreenModeRow",
          kind: "FittableColumns",      
          components:  [
        	{tag: "label", content: "Fullscreen mode", 
             style: "width: 13em; margin-left:3em;"},
            {kind: "onyx.PickerDecorator",
                name: "fullScreenMode", 
                onSelect: "screenModeSelected",
              
                components: [ 
                {kind: "onyx.PickerButton", content: ""},
                {kind: "onyx.Picker",
                  name:"fullScreen",
                  handlers: { onSelect: 'selectEvent'
                             },
                  components: [
                  {content: "true",active: true},
                  {content: "false"}
                  
                  ],
                  selectEvent: function(inSender, inValue) {
                     this.bubble('onScreenModeSelected', inValue);
                       }
                  }
              ]}
            ]                                               
        });                       
     },
     /*
       Permission ui components.
     */
      
     createBatteryPermissionRow: function(){
       this.$.targetsRows.$.permissions.$.targetDrw.createComponent({
            name: "BatteryPermissionRow",                                    
            kind: "FittableRows",      
            components:  [
             
          	{tag: "label", content: "Battery", 
             style: "width: 13em; margin-left:3em; margin-right: 10em;"},
             {kind: "onyx.Checkbox",
              name: "BaterryPermissionChkBx", 
              onchange: ""}
           ]});                                   
     },
     
     createCameraPermissionRow: function(){
      this.$.targetsRows.$.permissions.$.targetDrw.createComponent({
            name: "CameraPermissionRow",                                    
            kind: "FittableRows",      
            components:  [
             
          	{tag: "label", content: "Camera", 
             style: "width: 13em; margin-left:3em; margin-right: 10em;"},
             {kind: "onyx.Checkbox",
              name: "CameraPermissionChkBx", 
              onchange: ""}
           ]}); 
                                
     },
     
     createContactPermissionRow: function(){
         this.$.targetsRows.$.permissions.$.targetDrw.createComponent({
            name: "ContactPermissionRow",                                    
            kind: "FittableRows",      
            components:  [
             
          	{tag: "label", content: "Contact", 
             style: "width: 13em; margin-left:3em; margin-right: 10em;"},
             {kind: "onyx.Checkbox",
              name: "ContactPermissionChkBx", 
              onchange: ""}
           ]}); 
                                
     },
     
     createFilePermissionRow: function(){
       this.$.targetsRows.$.permissions.$.targetDrw.createComponent({
            name: "FilePermissionRow",                                    
            kind: "FittableRows",      
            components:  [
             {tag: "label", content: "File", 
             style: "width: 13em; margin-left:3em; margin-right: 10em;"},
             {kind: "onyx.Checkbox",
              name: "FilePermissionChkBx", 
              onchange: ""}
          	
           ]}); 
                                
     },
     
     createGeolocationRow: function(){
        this.$.targetsRows.$.permissions.$.targetDrw.createComponent({
            name: "GeolocationPermissionRow",                                    
            kind: "FittableRows",      
            components:  [
             {tag: "label", content: "Geolocation", 
             style: "width: 13em; margin-left:3em; margin-right: 10em;"},
             {kind: "onyx.Checkbox",
              name: "GeolocationPermissionChkBx", 
              onchange: ""}
           ]});                     
                                
     },
     
     createMediaRow: function(){
        this.$.targetsRows.$.permissions.$.targetDrw.createComponent({
            name: "MediaPermissionRow",                                    
            kind: "FittableRows",      
            components:  [
            {tag: "label", content: "Media: ", 
             style: "width: 13em; margin-left:3em; margin-right: 10em;" },
             {kind: "onyx.Checkbox",
              name: "MediaPermissionChkBx", 
              onchange: ""}
          	
           ]}); 
                                
     },
     
     createNetworkRow: function(){
       this.$.targetsRows.$.permissions.$.targetDrw.createComponent({
            name: "NetworkPermissionRow",                                    
            kind: "FittableRows",      
            components:  [
             {tag: "label", content: "Network", 
             style: "width: 13em; margin-left:3em; margin-right: 10em;"},
             {kind: "onyx.Checkbox",
              name: "NetworkPermissionChkBx", 
              onchange: ""}
           ]});
                                
     },
     
     createNotificationRow: function(){
       this.$.targetsRows.$.permissions.$.targetDrw.createComponent({
            name: "NotificationPermissionRow",                                    
            kind: "FittableRows",      
            components:  [
             
          	{tag: "label", content: "Notification", 
             style: "width: 13em; margin-left:3em; margin-right: 10em;"},
             {kind: "onyx.Checkbox",
              name: "NotificationPermissionChkBx", 
              onchange: ""}
           ]});
                                
     },
     
     createDeviceRow: function(){
       this.$.targetsRows.$.permissions.$.targetDrw.createComponent({
            name: "DevicePermissionRow",                                    
            kind: "FittableRows",      
            components:  [
             
          	{tag: "label", content: "Device", 
             style: "width: 13em; margin-left:3em; margin-right: 10em;"},
             {kind: "onyx.Checkbox",
              name: "DevicePermissionChkBx", 
              onchange: ""} 
           ]});
                                
     },  
     
     /*
       Android Specific ui components.
     */
     
      createMinSdkRow: function(){
          
          this.$.targetsRows.$.android.$.targetDrw.createComponent({
          name: "MinSdkRow",
          kind: "FittableColumns",
          //style: "margin-top:10px; margin-bottom: 10px;", 
              
          components:  [
        	{tag: "label", content: "Minimum SDK version",
            classes : "ares-bullet-label"},
            {kind: "onyx.InputDecorator", 
              components: [
                  {kind: "onyx.Input", name: "MinSdkInput"}
                   ]}
            ]                                               
        });       
                       
      },
      
      createMaxSdkRow: function(){
          
          this.$.targetsRows.$.android.$.targetDrw.createComponent({
          name: "MaxSdkRow",
          kind: "FittableColumns",      
          components:  [
        	{tag: "label", content: "Maximum SDK version", 
             style: "width: 13em; margin-left:3em;"},
            {kind: "onyx.InputDecorator", 
              components: [
                  {kind: "onyx.Input", name: "MaxSdkInput"}
                   ]}
            ]                                               
        });       
                       
      },
      
      createInstallLocationRow: function(){
       this.$.targetsRows.$.android.$.targetDrw.createComponent({
          name: "InstallLocationRow",
          kind: "FittableColumns",      
          components:  [
        	{tag: "label", content: "Install location", 
             style: "width: 13em; margin-left:3em;"},
            {kind: "onyx.PickerDecorator",
                name: "InstallLocationPD", 
                onSelect: "installLocationSelected", 
                components: [ 
                {kind: "onyx.PickerButton", content: ""},
                {kind: "onyx.Picker",
                  name:"InstallLocationPicker",
                  handlers: { onSelect: 'selectEvent'
                             },
                  components: [
                  {content: "Auto",active: true},
                  {content: "Internal Only"},
                  {content: "Prefer External"}
                  
                  ], 
                  selectEvent: function(inSender, inValue) {
                     this.bubble('onInstallLocationSelected', inValue);
                       }
                  }
              ]}
            ]                                               
        }); 
      },
      
      createSplashScreenDurationRow: function(){
       this.$.targetsRows.$.android.$.targetDrw.createComponent({
          name: "SplashScreenDurationRow",
          kind: "FittableColumns",      
          components:  [
        	{tag: "label", content: "Splash screen duration", 
             style: "width: 13em; margin-left:3em;"},
            {kind: "onyx.InputDecorator", 
              components: [
                  {kind: "onyx.Input", name:"SplashScreenDurationInput"}
                   ]}
            ]                                               
        });                                     
      },
      
      createUrlTimeOutRow: function(){
       this.$.targetsRows.$.android.$.targetDrw.createComponent({
          name: "UrlTimeOutRow",
          kind: "FittableColumns",      
          components:  [
        	{tag: "label", content: "Load URL timeout", 
             style: "width: 13em; margin-left:3em;"},
            {kind: "onyx.InputDecorator", 
              components: [
                  {kind: "onyx.Input", name:"UrlTimeOutInput"}
                   ]}
            ]                                               
        });                                     
      },
      
      
      createAndroidDefaultIconRow: function(){
       this.$.targetsRows.$.android.$.targetDrw.createComponent({
          name: "AndroidDefaultIconRow",
          kind: "FittableColumns",      
          components:  [
        	{tag: "label", content: "Default icon", 
             style: "width: 13em; margin-left:3em;"},
            {kind: "onyx.InputDecorator", 
              components: [
                  {kind: "onyx.Input", name:"AndroidDefaultIconInput"}
                   ]}
            ]                                               
        });                                     
      },
      
      createLdpiIconRow: function(){
        this.$.targetsRows.$.android.$.targetDrw.createComponent({
          name: "LdpiIconRow",
          kind: "FittableColumns",      
          components:  [
        	{tag: "label", content: "Ldpi icon", 
             style: "width: 13em; margin-left:3em;"},
            {kind: "onyx.InputDecorator", 
              components: [
                  {kind: "onyx.Input", name:"LdpiIconInput"}
                   ]}
            ]                                               
        });                 
      },
      
      createMdpiIconRow: function(){
        this.$.targetsRows.$.android.$.targetDrw.createComponent({
          name: "MdpiIconRow",
          kind: "FittableColumns",      
          components:  [
        	{tag: "label", content: "Mdpi icon", 
             style: "width: 13em; margin-left:3em;"},
            {kind: "onyx.InputDecorator", 
              components: [
                  {kind: "onyx.Input", name:"MdpiIconInput"}
                   ]}
            ]                                               
        });                 
      },
      
      createHdpiIconRow: function(){
        this.$.targetsRows.$.android.$.targetDrw.createComponent({
          name: "HdpiIconRow",
          kind: "FittableColumns",      
          components:  [
        	{tag: "label", content: "Hdpi icon", 
             style: "width: 13em; margin-left:3em;"},
            {kind: "onyx.InputDecorator", 
              components: [
                  {kind: "onyx.Input", name:"HdpiIconInput"}
                   ]}
            ]                                               
        });                 
      },
      
      createXdpiIconRow: function(){
        this.$.targetsRows.$.android.$.targetDrw.createComponent({
          name: "XdpiIconRow",
          kind: "FittableColumns",      
          components:  [
        	{tag: "label", content: "Xdpi icon", 
             style: "width: 13em; margin-left:3em;"},
            {kind: "onyx.InputDecorator", 
              components: [
                  {kind: "onyx.Input", name:"XdpiIconInput"}
                   ]}
            ]                                               
        });                 
      },
     
     
     
     
     /*
       IOS specific ui components.
     */
     
     createWebViewBounceRow: function(){
         this.$.targetsRows.$.ios.$.targetDrw.createComponent({
          name: "WebViewBounceRow",
          kind: "FittableColumns",      
          components:  [
        	{tag: "label", content: "Web view bounce", 
             style: "width: 13em; margin-left:3em;"},
            {kind: "onyx.PickerDecorator",
                name: "wvMode", 
                onSelect: "webViewBounceSelected", 
                components: [ 
                {kind: "onyx.PickerButton", content: ""},
                {kind: "onyx.Picker",
                  name:"webViewBouncePicker",
                  handlers: { onSelect: 'selectEvent'
                             },
                  components: [
                  {content: "true",active: true},
                  {content: "false"}
                  
                  ],
                  selectEvent: function(inSender, inValue) {
                     this.bubble('onWebViewBounceSelected', inValue);
                       }}
              ]}
            ]                                               
        });                       
     },    
     
       createPrerenderedIconRow: function(){
         this.$.targetsRows.$.ios.$.targetDrw.createComponent({
          name: "prerenderedIconRow",
          kind: "FittableColumns",      
          components:  [
        	{tag: "label", content: "Prerendred icon", 
             style: "width: 13em; margin-left:3em;"},
            {kind: "onyx.PickerDecorator",
                name: "prerenderedIconPD", 
                onSelect: "prerenderedIconSelected", 
                components: [ 
                {kind: "onyx.PickerButton", content: ""},
                {kind: "onyx.Picker",
                  name:"prerenderedIconPicker",
                  handlers: { onSelect: 'selectEvent'
                             },
                  components: [
                  {content: "true",active: true},
                  {content: "false"}
                  ],
                  selectEvent: function(inSender, inValue) {
                     this.bubble('onPrerenderedIconSelected', inValue);
                       }
                  }
              ]}
            ]                                               
        });                       
     },
     
     createOpenLinkWebViewRow: function(){
        this.$.targetsRows.$.ios.$.targetDrw.createComponent({
          name: "openLinkWebViewRow",
          kind: "FittableColumns",      
          components:  [
        	{tag: "label", content: "Open all links in web view", 
             style: "width: 13em; margin-left:3em;"},
            {kind: "onyx.PickerDecorator",
                name: "openLinkWebViewPD", 
                onSelect: "openLinkWebViewSelected", 
                components: [ 
                {kind: "onyx.PickerButton", content: ""},
                {kind: "onyx.Picker",
                  name:"openLinkWebViewPicker",
                  handlers: { onSelect: 'selectEvent'
                             },
                  components: [
                  {content: "true",active: true},
                  {content: "false"}
                  
                  ],
                  selectEvent: function(inSender, inValue) {
                     this.bubble('onOpenLinkWebViewSelected', inValue);
                       }
                  }
              ]}
            ]                                               
        });                                 
                            
     },
     createStatusBarStyleRow: function(){
      this.$.targetsRows.$.ios.$.targetDrw.createComponent({
          name: "StatusBarStyleRow",
          kind: "FittableColumns",      
          components:  [
        	{tag: "label", content: "Status Bar style", 
             style: "width: 13em; margin-left:3em;"},
            {kind: "onyx.PickerDecorator",
                name: "StatusBarStylePD", 
                onSelect: "statusBarStyleSelected", 
                components: [ 
                {kind: "onyx.PickerButton", content: ""},
                {kind: "onyx.Picker",
                  name:"StatusBarStylePicker",
                  handlers: { onSelect: 'selectEvent'
                             },
                  components: [
                  {content: "black-opaque",active: true},
                  {content: "black-translucent"}
                  
                  ],
                  selectEvent: function(inSender, inValue) {
                     this.bubble('onStatusBarStyleSelected', inValue);
                       }
                  }
              ]}
            ]                                               
        });   
                              
     },
     createDetectDataTypeRow: function(){
         this.$.targetsRows.$.ios.$.targetDrw.createComponent({
          name: "DetectDataTypeRow",
          kind: "FittableColumns",      
          components:  [
        	{tag: "label", content: "Detect Data type", 
             style: "width: 13em; margin-left:3em;"},
            {kind: "onyx.PickerDecorator",
                name: "DetectDataTypePD", 
                onSelect: "detectDataTypeSelected", 
                components: [ 
                {kind: "onyx.PickerButton", content: ""},
                {kind: "onyx.Picker",
                handlers: { onSelect: 'selectEvent'
                             },
                  name:"DetectDataTypePicker",
                  components: [
                  {content: "true",active: true},
                  {content: "false"}
                  
                  ],
                  selectEvent: function(inSender, inValue) {
                     this.bubble('onDetectDataTypeSelected', inValue);
                       }
                  }
              ]}
            ]                                               
        }); 
                                    
     },
     
     createExitOnSuspendRow: function(){
         this.$.targetsRows.$.ios.$.targetDrw.createComponent({
          name: "ExitOnSuspendRow",
          kind: "FittableColumns",      
          components:  [
        	{tag: "label", content: "Exit on suspend", 
             style: "width: 13em; margin-left:3em;"},
            {kind: "onyx.PickerDecorator",
                name: "ExitOnSuspendPD", 
                onSelect: "exitOnSuspendSelected", 
                components: [ 
                {kind: "onyx.PickerButton", content: ""},
                {kind: "onyx.Picker",
                  name:"ExitOnSuspendPicker",
                  handlers: { onSelect: 'selectEvent'
                             },
                  components: [
                  {content: "true",active: true},
                  {content: "false"}
                  
                  ], 
                  selectEvent: function(inSender, inValue) {
                     this.bubble('onExitOnSuspendSelected', inValue);
                       }
                  }
              ]}
            ]                                               
        }); 
                                    
     },
     createSplashScreenSpinner: function(){
      this.$.targetsRows.$.ios.$.targetDrw.createComponent({
          name: "SplashScreenSpinnerRow",
          kind: "FittableColumns",      
          components:  [
        	{tag: "label", content: "Show splash screen spinner", 
             style: "width: 13em; margin-left:3em;"},
            {kind: "onyx.PickerDecorator",
                name: "SplashScreenSpinnerPD", 
                onSelect: "splashScreenSpinnerSelected", 
                components: [ 
                {kind: "onyx.PickerButton", content: ""},
                {kind: "onyx.Picker",
                  name:"SplashScreenSpinnerPicker",
                   handlers: { onSelect: 'selectEvent'
                             },
                  components: [
                  {content: "true",active: true},
                  {content: "false"}
                  
                  ], 
                  selectEvent: function(inSender, inValue) {
                     this.bubble('onExitSplashScreenSpinnerSelected', inValue);
                       }
                  }
              ]}
            ]                                               
        });                     
     },
     
     createAutoHideSplashScreen: function(){
      this.$.targetsRows.$.ios.$.targetDrw.createComponent({
          name: "AutoHideSplashScreenRow",
          kind: "FittableColumns",      
          components:  [
        	{tag: "label", content: "Auto hide splash screen", 
             style: "width: 13em; margin-left:3em;"},
            {kind: "onyx.PickerDecorator",
                name: "AutoHideSplashScreenPD", 
                onSelect: "autoHideSplashScreenSelected", 
                components: [ 
                {kind: "onyx.PickerButton", content: ""},
                {kind: "onyx.Picker",
                  name:"AutoHideSplashScreenPicker",
                   handlers: { onSelect: 'selectEvent'
                             },
                  components: [
                  {content: "true"},
                  {content: "false", active: true}
                  
                  ], 
                  selectEvent: function(inSender, inValue) {
                     this.bubble('onAutoHideSplashScreenSelected', inValue);
                       }
                  }
              ]}
            ]                                               
        });                              
     },
     createIosIcon: function(){
      this.$.targetsRows.$.ios.$.targetDrw.createComponent({
          name: "IosIconRow",
          kind: "FittableColumns",      
          components:  [
            {tag: "label", content: "Icon: ", 
             style: "width: 13em; margin-left:3em;"},
            {kind: "onyx.InputDecorator", 
              components: [
                  {kind: "onyx.Input", name: "IosIconInput"}
                   ]}
             ]                                               
        });                      
     },
     
     
     /*
       Black Berry specific ui components.
     */
      createDisableCursorRow: function(){                              
       this.$.targetsRows.$.blackberry.$.targetDrw.createComponent({
          name: "DisableCursorRow",
          kind: "FittableColumns",      
          components:  [
        	{tag: "label", content: "Disable cursor", 
             style: "width: 13em; margin-left:3em;"},
            {kind: "onyx.PickerDecorator",
                name: "DisableCursorPD", 
                onSelect: "DisableCursorSelected", 
                components: [ 
                {kind: "onyx.PickerButton", content: ""},
                {kind: "onyx.Picker",
                  name:"DisableCursorPicker",
                  handlers: { onSelect: 'selectEvent'
                             },
                  components: [
                  {content: "true"},
                  {content: "false", active: true}
                  
                  ], 
                  selectEvent: function(inSender, inValue) {
                     this.bubble('onDisableCursorSelected', inValue);
                       }
                  }
              ]}
            ]                                               
        }); 
                           
      },
      
      createBlackBerryIconRow: function(){
         this.$.targetsRows.$.blackberry.$.targetDrw.createComponent({
          name: "BlackBerryIconRow",
          kind: "FittableColumns",      
          components:  [
            {tag: "label", content: "Icon", 
             style: "width: 13em; margin-left:3em;"},
            {kind: "onyx.InputDecorator", 
              components: [
                  {kind: "onyx.Input", name: "BlackBerryIconInput"}
                   ]}
             ]                                               
        });                            
      },
      
      createIconHoverStateRow: function(){
         this.$.targetsRows.$.blackberry.$.targetDrw.createComponent({
          name: "IconHoverStateRow",
          kind: "FittableColumns",      
          components:  [
            {tag: "label", content: "Icon hover state", 
             style: "width: 13em; margin-left:3em;"},
            {kind: "onyx.InputDecorator", 
              components: [
                  {kind: "onyx.Input", name: "IconHoverStateInput"}
                   ]}
             ]                                               
        });                            
      },
    
    
 
     /*
        functions to show/hide the Drawer and to manage the
        associated check box. 
     */                          
     updateGeneralDrawer: function(){            
        this.$.GeneralDrawer.setOpen(this.$.GeneralChkBx.checked);
		this.setGeneralEnabled(this.$.GeneralChkBx.checked);           
     },          
     
     
     updatePermissionsDrawer: function(){            
        this.$.PermissionsDrawer.setOpen(this.$.PermissionsChkBx.checked);
		this.setPermissionsEnabled(this.$.PermissionsChkBx.checked);           
     },
     
     
     updateAndroidDrawer: function(){            
        this.$.AndroidDrawer.setOpen(this.$.AndroidChkBx.checked);
		this.setAndroidEnabled(this.$.AndroidChkBx.checked);           
     },
     
     
     updateIOSDrawer: function(){            
        this.$.IosDrawer.setOpen(this.$.IOSChkBx.checked);
		this.setIosEnabled(this.$.IOSChkBx.checked);           
     },
     
     updateBlackBerryDrawer: function(){            
        this.$.BlackBerryDrawer.setOpen(this.$.BlackBerryChkBx.checked);
		this.setBlackBerryEnabled(this.$.BlackBerryChkBx.checked);           
     }, 
     
     
               
     
                            
                              
   		                                     
  	 generalEnabledChanged: function(old) {         
    		if (this.debug){
              this.log("id:", this.targetId, old, "->", this.generalEnabled); 
              }  
    		this.$.GeneralChkBx.setChecked(this.generalEnabled);   
    		this.updateGeneralDrawer();                  
    	/*	if (this.enabled) {                   
    			this.config = this.config || {};   
    		} else {                              
    			this.config = false;               
    		} */                                    
    	 }, 
       
     permissionsEnabledChanged: function(old) {         
  		if (this.debug){
            this.log("id:", this.targetId, old, "->", this.permissionsEnabled); 
            }  
  		this.$.PermissionsChkBx.setChecked(this.permissionsEnabled);   
  		this.updatePermissionsDrawer();                  
  	/*	if (this.enabled) {                   
  			this.config = this.config || {};   
  		} else {                              
  			this.config = false;               
  		} */                                    
  	 },
       
       androidEnabledChanged: function(old) {         
  		if (this.debug){
            this.log("id:", this.targetId, old, "->", this.androidEnabled); 
            }  
  		this.$.AndroidChkBx.setChecked(this.androidEnabled);   
  		this.updateAndroidDrawer();                  
  	/*	if (this.enabled) {                   
  			this.config = this.config || {};   
  		} else {                              
  			this.config = false;               
  		} */                                    
  	 },   
       
        iosEnabledChanged: function(old) {         
  		if (this.debug){
            this.log("id:", this.targetId, old, "->", this.iosEnabled); 
            }  
  		this.$.IOSChkBx.setChecked(this.iosEnabled);   
  		this.updateIOSDrawer();                  
  	/*	if (this.enabled) {                   
  			this.config = this.config || {};   
  		} else {                              
  			this.config = false;               
  		} */                                    
  	 },   
       
       blackBerryEnabledChanged: function(old) {         
  		if (this.debug){
            this.log("id:", this.targetId, old, "->", this.blackBerryEnabled); 
            }  
  		this.$.BlackBerryChkBx.setChecked(this.blackBerryEnabled);   
  		this.updateBlackBerryDrawer();                  
  	/*	if (this.enabled) {                   
  			this.config = this.config || {};   
  		} else {                              
  			this.config = false;               
  		} */                                    
  	 }, 
     
     
       
      /*
        Handlers for the "GeneralDrawer".
      */                                     
                                          
     versionSelected: function(inSender, inValue) {
        this.version = inValue.content;       
       if (this.debug) {                  
          this.log("version Selected: " + this.version);
         } 
         return true;                               
    },
    
    orientationSelected: function(inSender, inValue){
       this.orientation= inValue.content;
       if (this.debug) {                  
          enyo.log("orientation Selected: " + this.orientation);
         }
         return true;                      
    },

    screenModeSelected: function(inSender, inValue){
       this.screenMode= inValue.content;
       if (this.debug) {                  
          enyo.log("Screen mode Selected: " + this.screenMode);
         }
         return true;                      
    },
    
    
    
    /*
      Handlers for "AndroidDrawer".
    */
    installLocationSelected: function(inSender, inValue){
      this. installLocation=inValue.content;
       if (this.debug) {                  
          enyo.log("Install location value Selected: " + this.installLocation);
         }
         return true;          
                             
    },
    
    
    /*
      Handlers for the "IosDrawer".
    */
    webViewBounceSelected: function(inSender, inValue){
       this.webViewBounce=inValue.content;
       if (this.debug) {                  
          enyo.log("Web view bounce value Selected: " + this.webViewBounce);
         }
         return true;                       
    },
    
    prerenderedIconSelected: function(inSender, inValue){
       this.prerenderedIcon = inValue.content;
       if (this.debug) {                  
          enyo.log("Prerendred icon value Selected: " + this.prerenderedIcon);
         }
         return true;                                
    }, 
    openLinkWebViewSelected: function(inSender, inValue){
      this.openLinkWebView = inValue.content;
       if (this.debug) {                  
          enyo.log("openLinkWebView value Selected: " + this.openLinkWebView);
         }
         return true;                           
    },
    statusBarStyleSelected: function(inSender, inValue){
     this.statusBarStyle = inValue.content;
       if (this.debug) {                  
          enyo.log("Status Bar style value Selected: " + this.statusBarStyle);
         } 
       return true;                          
    }, 
    
 
    
    detectDataTypeSelected: function(inSender, inValue){
      this.detectDataType = inValue.content;
       if (this.debug) {                  
          enyo.log("detect data type value Selected: " + this.detectDataType);
         }
         return true;                             
    },
                                                                                
    exitOnSuspendSelected: function(inSender, inValue){
      this.exitOnSuspend = inValue.content;
       if (this.debug) {                  
          enyo.log("Exit on suspend value Selected: " + this.exitOnSuspend);
         }
         return true;                                    
    }, 
    
    exitSplashScreenSpinnerSelected: function(inSender, inValue){
      this.splashScreenSpinner = inValue.content;
       if (this.debug) {                  
          enyo.log("Splash screen spinner value Selected: " + 
          this.splashScreenSpinner);
         }
         return true;                              
    }, 
    
    autoHideSplashScreenSelected: function(inSender, inValue){
       this.autoHideSplashScreen = inValue.content;
       if (this.debug) {                  
          enyo.log("auto-hide splash screen value Selected: " + 
          this.autoHideSplashScreen);
         } 
         return true;                              
    },
    
    /*
      Handlers for Black Berry Drawer.
    */ 
    disableCursorSelected: function(inSender, inValue){
     this.disableCursor = inValue.content;
       if (this.debug) {                  
          this.log("disableCursor value Selected: " + 
          this.disableCursor);
         }
         return true;                               
    },
     
     
     
	setProjectConfig: function(config) {
		this.config = config;
		if (this.debug) this.log("contenu config:", this.config);
		this.config.enabled = true;

		this.$.pgConfId.setValue(config.appId || '' );
		this.$.pgIconUrl.setValue(config.icon.src || config.icon.src );

		this.config.targets = this.config.targets || {};

		enyo.forEach(this.targets, function(target) {
			this.$.targetsRows.$[target.id].setProjectConfig(this.config.targets[target.id]);
		}, this);
		this.refresh();
	},
	getProjectConfig: function() {
		this.config.appId   = this.$.pgConfId.getValue();
		this.config.icon.src = this.$.pgIconUrl.getValue();

		enyo.forEach(this.targets, function(target) {
			this.config.targets[target.id] = this.$.targetsRows.$[target.id].getProjectConfig();
		}, this);
		
		if (this.debug) this.log("config:", this.config);
		return this.config;
	},
	/**
	 * @protected
	 */
	refresh: function(inSender, inValue) {
		if (this.debug) this.log("sender:", inSender, "value:", inValue);
		var provider = Phonegap.ProjectProperties.getProvider();
		provider.authorize(enyo.bind(this, this.loadKeys));
	},
	/**
	 * @protected
	 */
	configure: function(inSender, inValue) {
		if (this.debug) this.log("sender:", inSender, "value:", inValue);
		this.doConfigure({id: 'phonegap'});
	},
	/**
	 * @protected
	 */
	loadKeys: function(err) {
		if (this.debug) this.log("err:", err);
		if (err) {
			this.warn("err:", err);
		} else {
			var provider = Phonegap.ProjectProperties.getProvider();
			enyo.forEach(this.targets, function(target) {
				this.$.targetsRows.$[target.id].loadKeys(provider);
			}, this);
		}
	},
	statics: {
		platforms: [
            {id: 'general',		name: "General"},
            {id: 'permissions',		name: "Permissions"},
			{id: 'android',		name: "Google Android"},
			{id: 'ios',		name: "Apple iOS"},
			{id: 'winphone',	name: "Microsoft Windows Phone 7"},
			{id: 'blackberry',	name: "RIM Blackberry"},
			{id: 'webos',		name: "HP webOS 2"}
		],
		getProvider: function() {
			this.provider = this.provider || ServiceRegistry.instance.resolveServiceId('phonegap');
			return this.provider;
		}
	}
});

/**
 * This widget is aware of the differences between the Phoneap Build targets.
 */
enyo.kind({
	name: "Phonegap.ProjectProperties.Target",
	debug: true,
	published: {
		targetId: "",
		targetName: "",
		enabled: "",
		keys: {},
		config: {}
	},
  
	components: [
			{name: "targetChkBx", kind: "onyx.Checkbox", onchange: "updateDrawer"},
			{tag:"label", name: "targetLbl", classes:"ares-label", content: ""},
			{name: "targetDrw", orient: "v", kind: "onyx.Drawer", open: false,
            classes:"ares-row ares-drawer",  components: [
					
			]}
	],
	/**
	 * @private
	 */
	create: function() {
		this.inherited(arguments);
		this.targetNameChanged();
	},
	setProjectConfig: function(config) {
		if (this.debug) this.log("id:", this.targetId, "config:", config);
		this.config = config;
		this.setEnabled(!!this.config);
		if (this.enabled && this.$.targetDrw.$.keySelector) {
			 this.$.targetDrw.$.keySelector.setActiveKeyId(this.config.keyId);
		}
	},
	getProjectConfig: function() {
		if (this.enabled && this.$.targetDrw.$.keySelector) {
			this.config.keyId = this.$.targetDrw.$.keySelector.getActiveKeyId();
		}
		if (this.debug) this.log("id:", this.targetId, "config:", this.config);
		return this.config;
	},
	/**
	 * @private
	 */
	targetNameChanged: function(old) {
		//if (this.debug) this.log(old, "->", this.enabled);
		this.$.targetLbl.setContent(this.targetName);
	},
	/**
	 * @private
	 */
	enabledChanged: function(old) {
		if (this.debug) this.log("id:", this.targetId, old, "->", this.enabled);
		this.$.targetChkBx.setChecked(this.enabled);
		this.updateDrawer();
		if (this.enabled) {
			this.config = this.config || {};
		} else {
			this.config = false;
		}
	},
	/**
	 * @protected
	 */
	loadKeys: function(provider) {
		if ((this.targetId === 'android' ||
		     this.targetId === 'ios' ||
		     this.targetId === 'blackberry')) {
			if (this.debug) this.log("id:", this.targetId);

			if (this.$.targetDrw.$.keySelector) {
				this.$.targetDrw.$.keySelector.destroy();
			}

			var keys = provider.getKey(this.targetId);
			if (this.debug) this.log("id:", this.targetId, "keys:", keys);
			if (keys) {
				this.$.targetDrw.createComponent({
					name: "keySelector",
					kind: "Phonegap.ProjectProperties.KeySelector",
					targetId: this.targetId,
					keys: keys,
					activeKeyId: (this.config && this.config.keyId)
				});
				this.$.targetDrw.$.keySelector.render();
				this.$.targetDrw.$.keySelector.setProvider(provider);
			}
		}
	},
	/**
	 * @private
	 */
	updateDrawer: function() {
		this.$.targetDrw.setOpen(this.$.targetChkBx.checked);
		this.setEnabled(this.$.targetChkBx.checked);
	}
});

enyo.kind({
	name: "Phonegap.ProjectProperties.KeySelector",
	debug: false,
	kind: "FittableRows",
	published: {
		targetId: "",
		keys: undefined,
		activeKeyId: undefined,
		provider: undefined
	},
	components: [
		{ components: [
			{tag: "label", classes : "ares-bullet-label", content: "Signing Key: "},
			{name: "keyPicker", kind: "onyx.PickerDecorator", onSelect: "selectKey", components: [
				{kind: "onyx.PickerButton", content: "Choose..."},
				{kind: "onyx.Picker", name: "keys"}
			]},
			// android, ios & blackberry: key password
			{kind: "onyx.InputDecorator", components: [
				{content: "Key:"},
				{name: "keyPasswd", kind: "onyx.Input", type: "password", placeholder: "Password..."}
			]},
			// android-only: keystore password
			{kind: "onyx.InputDecorator", name: "keystorePasswdFrm", showing: false, components: [
				{content: "Keystore:"},
				{name: "keystorePasswd", kind: "onyx.Input", type: "password", placeholder: "Password..."}
			]},
			{kind: "onyx.Button", content: "Save", ontap: "savePassword"}
		]}
	],
	create: function() {
		this.inherited(arguments);
		this.keysChanged();
		this.activeKeyIdChanged();
	},
	/**
	 * @private
	 */
	keysChanged: function(old) {
		if (this.debug) this.log("id:", this.targetId, old, "->", this.keys);

		// Sanity
		this.keys = this.keys || [];

		// Make sure 'None' (id == -1) is always available
		if (enyo.filter(this.keys, function(key) {
			return key.id === undefined;
		})[0] === undefined) {
			this.keys.push({id: undefined, title: "None"});
		}

		// Fill
		enyo.forEach(this.keys, function(key) {
			this.$.keys.createComponent({
				name: key.id,
				content: key.title,
				active: (key.id === this.activeKeyId)
			});
		}, this);
	},
	/**
	 * @private
	 */
	activeKeyIdChanged: function(old) {
		var key = this.getKey(this.activeKeyId);
		if (this.debug) this.log("id:", this.targetId, old, "->", this.activeKeyId, "key:", key);
		if (key) {
			// One of the configured keys
			if (this.targetId === 'ios' || this.targetId === 'blackberry') {
				// property named '.password' is defined by Phonegap
				this.$.keyPasswd.setValue(key.password || "");
			} else if (this.targetId === 'android') {
				// properties named '.key_pw'and 'keystore_pw' are defined by Phonegap
				this.$.keyPasswd.setValue(key.key_pw || "");
				this.$.keystorePasswd.setValue(key.keystore_pw || "");
				this.$.keystorePasswdFrm.show();
			}
		}
	},
	/**
	 * @protected
	 */
	getKey: function(keyId) {
		if (keyId) {
			return enyo.filter(this.keys, function(key) {
				return key.id === keyId;
			}, this)[0];
		} else {
			return undefined;
		}
	},
	/**
	 * @private
	 */
	selectKey: function(inSender, inValue) {
		this.log("sender:", inSender, "value:", inValue);
		enyo.forEach(this.keys, function(key) {
			if (key.title === inValue.content) {
				this.setActiveKeyId(key.id);
				this.log("selected key:", key);
			}
		}, this);
	},
	/**
	 * Return a signing key object from the displayed (showing === true) widgets
	 * @private
	 */
	getShowingKey: function() {
		var key = this.getKey(this.activeKeyId);
		if (!key) {
			return undefined;
		} else if (this.targetId === 'ios' || this.targetId === 'blackberry') {
			// property name '.password' is defined by Phonegap
			key.password = this.$.keyPasswd.getValue();
		} else if (this.targetId === 'android') {
			// properties names '.key_pw'and 'keystore_pw' are defined by Phonegap
			key.key_pw = this.$.keyPasswd.getValue();
			key.keystore_pw = this.$.keystorePasswd.getValue();
		}
		return key;
	},
	/**
	 * @private
	 */
	savePassword: function(inSender, inValue) {
		if (this.debug) this.log("sender:", inSender, "value:", inValue);
		var key = this.getShowingKey();
		if (this.debug) this.log("targetId:", this.targetId, "key:", key);
		this.provider.setKey(this.targetId, key);
	}
});