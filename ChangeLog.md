ChangeLog
=========

**Release: ares-ide 0.2.13**

Brief:
* Bug fix release

Details:
* Fix error shown when loading big project
* Fix error on file open done after closing designer (Closes: ENYO-4003)

Ares Sprint 23 & 24 & so on... Jan 31th - Feb 13th / Feb 14th - Mar 06th / Mar 07th - Mar 25th
----------------------------------------------------------------------------------------------

**Release: ares-ide 0.2.12-1**

Brief:

* A major code re-layout has been performed to approach a possible MVC segmentation of the application
* Minification of Ares 2 is now possible
* Integration of an external contribution (John McConnell aka micro-tech) as experimental feature: Hera (CSS editor)

Details:

* ENYO-2627, Ares : Make possible to minify ares-project
* ENYO-2938, Switch Ares from g11n to enyo-ilib
* ENYO-3244, "Save all" is needed as "Close all"
* ENYO-3561, Ares built apps have incorrect index.html in apk files
* ENYO-3600, PGB UI must allow the user to define multiple Access Origin instances
* ENYO-3626, Ares.openDocument() allows multiple file open in parallel
* ENYO-3632, No callback for codeUpdate message
* ENYO-3651, Ares: libraries update - up to 2.3.0-RC5 (above surely)
* ENYO-3653, Opening the very first source code file causes a "Switching Project"
* ENYO-3658, Switching to a non-Enyo project never ends
* ENYO-3704, TabBar: right menu switches tabs but does not switch content
* ENYO-3708, Re-layout Ares source code for EnyoEditor
* ENYO-3735, Open existing non-Ares Enyo project has no effect
* ENYO-3737, Unlabeled "Red X" icon opens up file location dialog for Select Top File
* ENYO-3741, Project Preview: zoom slider do not fit the size of the application
* ENYO-3743, Integrate Hera Css editor
* ENYO-3753, replace the single "cancel" button by a "done" button in PGB service login window
* ENYO-3754, Search Project is broken.
* ENYO-3757, A template name too long it doesn't fit in the drop down.
* ENYO-3760, Ares: Editor Settings aren't initialised if localStorage is empty
* ENYO-3761, For a non PGB enabled project, build, install and run are still enabled as button actions
* ENYO-3762, PGB Controls fails on new project - ENYO-3284 regression
* ENYO-3763, partial french translation of "file" menu in the Ares Editor
* ENYO-3784, PGB properties: at least one platform should be selected
* ENYO-3786, Enyo-yui-charts: Cors issue
* ENYO-3792, Preview/build command not available at hand
* ENYO-3798, Wrong file content displayed after closing a file tab.
* ENYO-3802, Ares: designer/preview buttons are overlapping
* ENYO-3826, On EnyoEditor toolbar, tooltips like New Kind, Editor ... are lost
* ENYO-3831, EnyoDesigner Button size issue; reload, fit checkbox, size drop down ...
* ENYO-3836, Project Shell: switching too quickly between 2 files from a same project does an error
* ENYO-3837, Project Shell: closing too quickly 2 files from a same project one after the other does an error
* ENYO-3838, Project Shell: opening a first file for a project happends late after the "waiting" popup closure
* ENYO-3842, Preview: resources not found after the "re-layout" operations
* ENYO-3848, Plugins: bad instanciation of a provider if it has never been enabled once
* ENYO-3851, It should be possible to select storage root to search for Ares projects
* ENYO-3857, FileManager: no more template found for .js files
* ENYO-3875, Ares: Language is always navigator's one when minified
* ENYO-3881, Ares: plugins loading failed

Ares Sprint 22 Jan 09th - Jan 30th
-----------------------------------

**Release: ares-ide 0.2.11**

Brief:

* A major refactoring has been done inside Ares to improve file and project switching while designer is opened.
* CORS issue fixes.
* PhoneGap build enhancements.
...

Details:

 * ENYO-1040, Comma position issue when inserting missing handler functions
 * ENYO-1943, Code editor: Context-sensitive help: via context-sensitive popup
 * ENYO-2118, Designer: feature to set zoom to "fit" the available space
 * ENYO-2217, AAAD, I can launch the PhoneGap build of my app and I am notified when the package is locally stored..
 * ENYO-2933, programble keys input box
 * ENYO-3067, Project Properties: in the project tab, showing bootplate version could be useful
 * ENYO-3104, Move Ares About to menu Ares -> About
 * ENYO-3143, For preview, the project name should be displayed in the window title
 * ENYO-3191, Native packaging for Windows (.MSI, based on NPM)
 * ENYO-3244, "Save all" is needed as "Close all"
 * ENYO-3282, Global Editor Settings: add button for reset to default settings
 * ENYO-3284, Phonegap build UI: Highlight the drawer that contains an error
 * ENYO-3305, Little inconsistency in project's context switching
 * ENYO-3311, Add indentation checking thru jshint and travis CI
 * ENYO-3316, Ares should implement new PhoneGap platform build selection
 * ENYO-3355, No more initial login into a PhoneGap Build account
 * ENYO-3373, Unable to resize by typing a size of a component(toolbar) in a font-style input box
 * ENYO-3375, I can fold or unfold all UI components palette window at once
 * ENYO-3391, Button is resized to its initial size
 * ENYO-3503, During PhoneGap build, the propertiesWidget_phonegapDrawer is opened but doesn't point build status	
 * ENYO-3506, Enable the "cancel build" action on the first build step
 * ENYO-3561, Ares built apps have incorrect index.html in apk files
 * ENYO-3565, Set the environment to deploy an .xap built application on a device
 * ENYO-3573, Properties: Ares must show the libraries version used by the developped application
 * ENYO-3576, Ares/PhoneGap should not use class static variables to exchange data between views
 * ENYO-3580, Project Properties: empty tooltip is visible for the popup
 * ENYO-3587, Ares: update Enyo/Onyx/layout/extra ... to pilot-13, rc1, rc2 or rc3
 * ENYO-3600, PGB UI must allow the user to define multiple Access Origin instances
 * ENYO-3626, Ares.openDocument() allows multiple file open in parallel
 * ENYO-3627, cleanup backward compat code after upgrade to onyx pilot-12++
 * ENYO-3629, Callback parameter should not be optional
 * ENYO-3630, Remove the verbose mode at Ares start up
 * ENYO-3632, No calback for codeUpdate message
 * ENYO-3634, ARES: cannot create project on out-of-the-box npm installation
 * ENYO-3637, Ares npm package must be installable without network
 * ENYO-3640, Ares: Create & Test weekly pre package for ares-0.2.10 (Sprint 21)
 * ENYO-3643, Set the defaut "phonegap-version" to 3.1.0
 * ENYO-3644, Add "android-targetSdkVersion" in android preferences
 * ENYO-3645, [chert] handle data update with different number of datasets
 * ENYO-3646, FileManager: Double-click on the node icon of a folder opens an empty gap in the filetree
 * ENYO-3647, [chert] handle variable number of data within datasets
 * ENYO-3651, Ares: libraries update - 2.3.0-RC4 and above
 * ENYO-3658, Switching to a non-Enyo project never ends
 * ENYO-3659, [chert] create a cartesianChart and polarChart (base for barchart and piechart)
 * ENYO-3660, [chert] support for enyo.collection
 * ENYO-3665, Ares: designer zoom/ preview zoom enyo.Select is not scaled
 * ENYO-3666, Impossible to move (drag'n'drop), rename or delete file in file manager.
 * ENYO-3676, Ares: Imported project cannot be selected
 * ENYO-3677, Designer: undo/redo doesn't work
 * ENYO-3678, FileManager: refresh is not performed after a DnD action
 * ENYO-3680, Designer: File/Close Project doesn't work
 * ENYO-3681, Ares: file tab keep a previous file after rename operation
 * ENYO-3682, Ares: All files are reopened after File/close all menu action
 * ENYO-3683, Ares: the title of the "open project" pop-up is cut
 * ENYO-3687, Phonegap Build feature must be integrated as a plugin in Ares
 * ENYO-3689, [chert] add filterlevel, inputtype and descriptions to the .design file
 * ENYO-3691, Inspector: nothing happens after choose file action on src attribute
 * ENYO-3692, Create a simplistic mobile application using Ares
 * ENYO-3700, Ares: Create & Test weekly pre package for ares-0.2.11 (Sprint 22)
 * ENYO-3727, Ares's ChangeLog.md was not updated since ares-0.1.4 (Sprint 14)
 * ENYO-3732, Change ares-generator's json substitutions being able to have new properties
 * ENYO-3738, QA Ares IDE: Sprint 22
 * ENYO-3739, Projects actions: cannot duplicate a newly created/opened project
 * ENYO-3757, A template name too long it doesn't fit in the drop down
 * ENYO-3758, PhoneGap Build: 3.0.0 is not an allowed value
 * ENYO-3759, add version.js to chert lib
 * ENYO-3760, Ares: Editor Settings aren't initialised if localStorage is empty
 * ENYO-3762, PGB Controls fails on new project - ENYO-3284 regression
 * ENYO-3765, Reimplement support for version 3.0.0 in phonegap
 * ENYO-3771, CORS issue / cannot authenticate to PGB service under CORS conditions 


Ares Sprint 21 Dec 12th - Jan 08th
-----------------------------------
**ares-ide 0.2.10 not released**

Fixes:

 * ENYO-1112, Ares designer discards sub-components derivated from enyo.Component
 * ENYO-2118, Designer: feature to set zoom to "fit" the available space
 * ENYO-2258, Designer: all kind definitions must have unique names
 * ENYO-2988, Missing shadow image during DnD from Palette to iFrame
 * ENYO-3082, Ares Designer: impossible to use the designer mode on files from different projects
 * ENYO-3233, Designer: impossible to use drag point on onyx.Button
 * ENYO-3305, Little inconsistency in project's context switching
 * ENYO-3373, Unable to resize by typing a size of a component(toolbar) in a font-style input box
 * ENYO-3375, I can fold or unfold all UI components palette window at once
 * ENYO-3386, ErrorPopup: wrong style in popup opened from IFrameDesigner	Bug	Medium
 * ENYO-3517, Edition is frozen for a too long period after each CTRL-S in Phobos, due to the Code Analyse update	Bug	High
 * ENYO-3557, Libraries: Update related design files with new Palette arrangement
 * ENYO-3576, Ares/PhoneGap should not use class static variables to exchange data between views
 * ENYO-3587, Ares: update Enyo/Onyx/layout/extra ... to pilot-13, rc1, rc2 or rc3
 * ENYO-3588, Ares: Create & Test weekly pre package for ares-0.2.9 (Sprint 20)
 * ENYO-3598, Project creation: change the structure of Phonegap UI data
 * ENYO-3616, Inspector: add file chooser on src attribute
 * ENYO-3622, Ares: version checking do not handle with "pre" and "rc"
 * ENYO-3638, Config.xml: Remove the default initialization on the height width images attributes
 * ENYO-3639, Ares: Publish ares-0.2.9 package on npmjs
 * ENYO-3643, Set the defaut "phonegap-version" to 3.1.0
 * ENYO-3644, Add "android-targetSdkVersion" in android preferences
 * ENYO-3659, [chert] create a cartesianChart and polarChart (base for barchart and piechart)
 * ENYO-3661, File deletion is broken	Bug	High
 * ENYO-3689, [chert] add filterlevel, inputtype and descriptions to the .design file

Ares Sprint 20 Nov 28th - Dec 12th
-----------------------------------

**Release: ares-ide 0.2.9**

Brief:

* Again a special attention on Enyo Designer and PhoneGap Build.
* Enhancements:
1. Enyo Inspector: to make possible the use a file chooser to define file path in for inspector src attribute
2. Enyo Inspector: a search field is added to filter-down the list of properties by name, for quickly finding a property
3. Node Server: the infinite recursion on server on Linux is fixed on Node archive operations
4. Ares uses http_proxy and https_proxy as environment variables
5. Support PhoneGap build for Windows Phone 8

Details:

* ENYO-1952, Inspector - Filter properties
* ENYO-2480, AAAD, I can locally debug a PhoneGap application
* ENYO-3046, cannot open designer when opening 2 App.js in a row (dup?)
* ENYO-3070, Designer Icon button is disabled in Phobos, after fixing a broken kind (dup?)
* ENYO-3127, Palette reload error in Designer (dup?)
* ENYO-3179, Designer: chert library not always shown in palette ... (dup?)
* ENYO-3181, Race conditions in Ares Designer
* ENYO-3336, AAAD, I want to Test & Debug using Apache Ripple or other Phonegap-enabled device emulator
* ENYO-3354, It is not possible to select _No Maximum API Level_ when building for Android on Ares
* ENYO-3393, PhoneGap configuration panel design is not enough packed
* ENYO-3432, designerFrame is empty after a project selection (dup?)
* ENYO-3434, When the minification is not active the PhoneGap build fails
* ENYO-3449, Archive operations fails with infinite recursion on server on Linux	Bug
* ENYO-3482, Support PhoneGap build for Windows Phone 8
* ENYO-3492, ares server should use http*_proxy enviroment variables
* ENYO-3497, Port HPPocket on enyo as a mobile app
* ENYO-3515, Programmable buttons Command-SHIFT F1 to F12 does not work
* ENYO-3527, Designer: Palette is wrecked after closing a file in designer (dup?)
* ENYO-3529, Ares: Create & Test weekly pre package for ares-0.2.8 (Sprint 19 - HP)
* ENYO-3568, Investigate/build/integrate a BarChart in a HPPocket-like environment
* ENYO-3571, Auto generated function creates issue
* ENYO-3574, The highlight on the selected item could be changed by an animated border
* ENYO-3586, Ares: Publish ares-0.2.8 package on npmjs
* ENYO-3593, Add the device Slate 7 to the devices list in the Designer
* ENYO-3594, Designer: component is badly highlighted after being modified
* ENYO-3596, Project creation: Shared configuration picker aren't initialized
* ENYO-2988, Missing shadow image during DnD from Palette to iFrame
* ENYO-3082, Ares Designer: impossible to use the designer mode on files from different projects
* ENYO-3305, Little inconsistency in project's context switching
* ENYO-3373, Unable to resize by typing a size of a component(toolbar) in a font-style input box
* ENYO-3375, I can fold or unfold all UI components palette window at once
* ENYO-3557, Libraries: Update related design files with new Palette arrangement
* ENYO-3616, Inspector: add file chooser on src attribute
 

Warnings:

* Detailed instructions in our GitHub https://github.com/enyojs/ares-project/blob/0.2.9/KNOWN-BUGS.md

Ares Sprint 19 Nov 07th - Nov 27th
-----------------------------------

**ares-ide 0.2.8 not released**

Fixes:

* ENYO-1369, Ares: enable CORS between the IDE server & the running Hermes services
* ENYO-1422, Ares: valid Enyo-2.3 widgets to the designer's palette
* ENYO-1836, Update design information for enyo, onyx, ...
* ENYO-2218, As an app developer, I can open in Ares most of the apps developed in Enyo 2.x
* ENYO-2846, enyo.*Strategy should not be shown in Designer's palette
* ENYO-3134, Designer: rendering is different depending on file tab switching order
* ENYO-3136, Ares: nothing indicates that a delete operation is in-progress
* ENYO-3183, Uncaught TypeError: Cannot read property 'addBefore' of null
* ENYO-3214, Regression: save file from designer performs nothing
* ENYO-3280, Designer: moving a resized onyx button from one container to another loses applied size
* ENYO-3283, Unable to create a project by NONE template version
* ENYO-3290, Palette should provide a entry with no kind name to take advantage of "defaultKind" available in onyx.PickerDecorator, onyx.Menu, ...
* ENYO-3349, Ares: Create & Test weekly pre package for ares-0.2.7
* ENYO-3356, Selecting a PhoneGap applicationId gives no clue before selection
* ENYO-3394, The "indicator turned" is not handled properly
* ENYO-3418, Designer: Unable to render panel.UpDownArranger component
* ENYO-3421, Designer: Unable to render when component enyo.TransitionScrollStrategy is used
* ENYO-3422, Designer: Unable to render when component enyo.UiComponent is used
* ENYO-3423, Designer: Unable to render when component enyo.ViewController is used
* ENYO-3427, Designer, Components list: components have no effects
* ENYO-3428, Iframe is empty after " close file" action
* ENYO-3508, Uncaught SyntaxError: Unexpected token , when switching from phobos to deimos (dup?)
* ENYO-3521, Cancel Build button appears sometimes in the starting build Phase.
* ENYO-3524, PhoneGap Build options are not stored correctly
* ENYO-3525, It's not possible to disable the service Phonegap Build
* ENYO-3530, Ares: Publish ares-0.2.7 package on npmjs
* ENYO-3531, Ares: update Enyo/Onyx/extra ... to pilot-12
* ENYO-3532, Ares Preview: Add the devices list the HP Slate 7
* ENYO-3550, Ares BootPlate Pilot 12 needed
* ENYO-3553, Uncaught TypeError: Object [object Object] has no method 'doError'
* ENYO-3555, design: options are not loaded correctly
* ENYO-3556, sampleEBC: welcome.js: scroller not handled correctly in designer
* ENYO-3570, FileManager: folders may be opened by double-clicking on the node label too	Task
* ENYO-2217, AAAD, I can launch the PhoneGap build of my app and I am notified when the package is locally stored
* ENYO-2353, Ares IDE cannot import a project generated by ares-generate
* ENYO-2493, HermesFileTree: autoscroll during DnD do not works with all browsers
* ENYO-3046, cannot open designer when opening 2 App.js in a row (dup?)
* ENYO-3070, Designer Icon button is disabled in Phobos, after fixing a broken kind (dup?)
* ENYO-3082, Ares Designer: impossible to use the designer mode on files from different projects
* ENYO-3127, Palette reload error in Designer (dup?)
* ENYO-3179, Designer: chert library not always shown in palette ... (dup?)
* ENYO-3191, Native packaging for Windows (.MSI, based on NPM)
* ENYO-3220, Android build error: Your Android signing key is locked
* ENYO-3393, PhoneGap configuration panel design is not enough packed
* ENYO-3425, Designer: components throw that it "has no method getBoundingClientRect" error when moved in ComponentView
* ENYO-3432, designerFrame is empty after a project selection (dup?)
* ENYO-3434, When the minification is not active the PhoneGap build fails
* ENYO-3449, Archive operations fails with infinite recursion on server on Linux
* ENYO-3492, ares server should use http*_proxy enviroment variables
* ENYO-3514, Phonegap build is impossible on Windows 8 and Mac OS X
* ENYO-3517, Edition is frozen for a too long period after each CTRL-S in Phobos, due to the Code Analyse update
* ENYO-3527, Designer: Palette is wrecked after closing a file in designer (dup?)
* ENYO-3529, Ares: Create & Test weekly pre package for ares-0.2.8 (Sprint 19 - HP)
* ENYO-3554, [HPPocket] Integrate the piechart in HPPocket
* ENYO-3557, Libraries: Update related design files with new Palette arrangement
* ENYO-3561, Ares built apps have incorrect index.html in apk files
* ENYO-3571, Auto generated function creates issue
* ENYO-3576, Ares/PhoneGap should not use class static variables to exchange data between views
 
Ares Sprint 18 Oct 17th - Nov 06th
-----------------------------------

**Release: ares-ide 0.2.7**

Brief:

Two main focus:

1. The Enyo designer:
	* Ares2 is now capable of loading more hand-written Enyo 2.3 applications without 	complaining & is itself based on the announced pre-release of Enyo 2.3 (pre.10).
	* The CSS editor is capable of dealing with the text color.
	* The widget palette now has a built-in text-based filter. 
	* All of the Enyo/Onyx 2.3 great widgets now show-up in the Ares2 palette.
...

2. The PhoneGap Build integration:
	* Ares2 now supports the latest PhoneGap version (3.x) and options as made available by the PhoneGap/Nitobi crew. 
	* Ares2 no longer wait for the build to be complete to return control to you (Ares2 download packages in the background). Downloaded packages can be installed on the developer's devices from a QR code available from within Ares.
	* It is now possible to select an AppId from a list of existing ones without knowing the AppId number (knowing names is enough).
	* It is now possible to build apps that consists into thousands of files (provided the total size does not exceed 15MB, which is the Adobe limit).
	* It is possible to cancel a running PhoneGap build (no need to wait until it fails...)

Details:

* ENYO-1481, Ares component view should scroll automatically to show the item selected in the Palette
* ENYO-1887, Palette - Implement kind filter
* ENYO-1968, Sliders can be dragged in the Ares designer
* ENYO-2044, Ares+PhoneGap build may fail with "Too Many open Files"
* ENYO-2572, Ares popup should me movable
* ENYO-2960, PhonegapBuild: Popup message not updated while waiting build status and package download
* ENYO-2992, Spurious 'style=""' appear when moving an existing component into the designer
* ENYO-3041, ACE error tooltip does not show-up correctly
* ENYO-3057, DnD from Kinds list don't work on Safari/MacOS
* ENYO-3061, Do Not Use connect.bodyParser with Express.js
* ENYO-3083, analyser does not follow path containing '$lib'
* ENYO-3131, phobos: need navigation helpers for methods, attributes ...
* ENYO-3132, Designer: item vanished after a reload action
* ENYO-3139, Ares: Create & Test weekly pre package for ares-0.2.6
* ENYO-3240, remove unsafe code from Ares TabBar (may break with future Enyo)
* ENYO-3256, Add the attribute maxFields when the multipart/data request is constructed in bdBase.js
* ENYO-3259, Ares: PhoneGap Build fails at minification step
* ENYO-3286, Designer: iframe is frozen after moving onyx.Groupbox in ComponentView
* ENYO-3287, Designer cannot be opened if images are already opened in editor
* ENYO-3294, odata-ares-plugin: No odata service defined
* ENYO-3340, Change the xml tag "plugin" to "feature" in config.xml
* ENYO-3342, Add the row windowSoftInputMode in Android preferences
* ENYO-3343, Adapt the xml tag for the platform selection to PG B 3.x
* ENYO-3351, Ares: Publish ares-0.2.6 package on npmjs
* ENYO-3368, Ares automatic download of packages from PhoneGap Build often fails
* ENYO-3385, Ares: Update enyo/layout/onyx with pilot 10
* ENYO-3392, Preview button does not work after drag&drop UI element
* ENYO-3429, Dnd doesnt work in HFT
* ENYO-3451, HFT is reloaded when file is switched in tab bar panel in the same project
* ENYO-3468, Ares: bad direction displayed for phobos/designer panel's move button
* ENYO-3477, Analyzer: TypeError {stack: (...), message: "Cannot read property 'kind' of undefined"}
* ENYO-3490, Update the Phonegap Build version selection
* ENYO-3494, Ares.DesignerFrame.renderKind(): Unable to render kind 'Ex.TipCalc':Cannot read property 'FittableRows' of null TypeError: Cannot read property 'FittableRows' of null
* ENYO-3504, Fix a regression on the Panel Phonegap Build
* ENYO-3528, manage "color property" to specify the color of text in cssEditor
* ENYO-1422, Ares: valid Enyo-2.3 widgets to the designer's palette
* ENYO-1836, Update design information for enyo, onyx, ...
* ENYO-3134, Designer: rendering is different depending on file tab switching order
* ENYO-3136, Ares: nothing indicates that a delete operation is in-progress
* ENYO-3179, Designer: chert library not always shown in palette ... (dup?)
* ENYO-3183, Uncaught TypeError: Cannot read property 'addBefore' of null

Ares Sprint 17 Sept 28th - Oct 16th
-----------------------------------

**Release: ares-ide 0.2.6**

Brief
(always first focused on stability) :

* a lot of bug fixes on Ares Designer,
* the contextual menu feature on file/folder has been introduced.

Details:

* ENYO-1969, Ares designer: Inspector calls "save" a lot, even when nothing changes
* ENYO-2774, designer: eval code fails with duplicated kind
* ENYO-2935, Allow to define an Ares template from a folder root	New Feature
* ENYO-2999, Catch Zalgo in Ares Node.js code (cleanup async/sync callbacks)
* ENYO-3078, The signing key is cleared if the Project properties pop-up is validated without reselecting the signing key
* ENYO-3118, Hook fake remote drives (DropBox, Box.net, GDrive... etc) into Ares
* ENYO-3129, The UI Phonegap build should control the input values
* ENYO-3133, Project Properties: Add description property to config.xml
* ENYO-3138, Ares: Publish ares-0.2.5 package on npmjs
* ENYO-3168, Ares: EnyoJS viewer launched with selected text as parameter
* ENYO-3182, No auto switch-back to code editor when unable to render a kind
* ENYO-3206, Ares: disable node.js 0.8.x
* ENYO-3219, Ares: x-http-method-overwrite is not allowed by Access-Control-Allow-headers
* ENYO-3232, Ares: update ide.json - use bootplate-2.3.0-pre.9.zip
* ENYO-3241, Ares: update Enyo to pilot-8
* ENYO-3281, HPWS Key-Value-Store / Login API evaluation
* ENYO-1887, Palette - Implement kind filter
* ENYO-2044, Ares+PhoneGap build may fail with "Too Many open Files"
* ENYO-2449, Add a Right-Click menu in the Hermes File Tree
* ENYO-2470, Designer: Sometimes the "Designer" button is not activated
* ENYO-2577, Phobos: Disambiguation tab tooltip for opened files
* ENYO-2960, PhonegapBuild: Popup message not updated while waiting build status and package download
* ENYO-3061, Do Not Use connect.bodyParser with Express.js
* ENYO-3110, Designer: delete component does not always work
* ENYO-3131, phobos: need navigation helpers for methods, attributes ...
* ENYO-3142, Project context should be related to the current opened file
* ENYO-3207, HPWS-MAF: update the package with ares-0.2.5
* ENYO-3259, Ares: PhoneGap Build fails at minification step
* ENYO-3283, Unable to create a project by NONE template version
* ENYO-3285, Ares cause error during generating app from a large zip file

Warnings:

* Node.js 0.8 has been deprecated. Ares ide is now running on Node.js upper or equal to 0.10.6.
* Detailed instructions in our GitHub https://github.com/enyojs/ares-project/blob/0.2.6/KNOWN-BUGS.md


Ares Sprint 16 Sept 16th- Sept 27th
-----------------------------------

**Release: ares-ide 0.2.5**

Brief: Big fixes and stability focus

* for ares designer, and,
* for phonegapbuild feature.

Details:

* ENYO-2963, Message "Sign-in is required" does not disappear after sign-in is done
* ENYO-3020, Ares can not work with unknown file extensions
* ENYO-3025, Default preview page and tooltip message is different
* ENYO-3029, PhoneGap Android Options - SDK Versions Drop-Down
* ENYO-3033, Designer reload error when developer click the reload button multiple times in Designer
* ENYO-3044, ACE keyboard shortcuts no longer works after some Phobos actions (i.e. click on file menu...)
* ENYO-3056, Autocomplete pop-up list is cut-off when it works at the bottom of the editor
* ENYO-3059, Property view error in the case of removing component
* ENYO-3060, New Folder wizard shows wrong parent folder information
* ENYO-3065, Project properties: lack information on the actual location of the project
* ENYO-3066, Project Properties: in the project tab, add a text box for the project description
* ENYO-3068, Ares dark buttons are not readable under Safari/Mac
* ENYO-3088, PhoneGap: error popup for PhoneGap account shown but no needed
* ENYO-3099, File/Folder Delete Popup: apply new style
* ENYO-3100, Remove popup: it has to be reseted after use
* ENYO-3106, Ares: Find Popup-missing message for replace result
* ENYO-3117, Provide support for training
* ENYO-3120, Update HPWS-MAF package for course delivery of 18th Sept
* ENYO-3121, Ares: Publish ares-0.2.4 package on npmjs
* ENYO-3123, Ares scripts/release.js -r doesn't work
* ENYO-2935, Allow to define an Ares template from a folder root
* ENYO-2999, Catch Zalgo in Ares Node.js code (cleanup async/sync callbacks)
* ENYO-3119, Ares: Create & Test weekly pre package for ares-0.2.5

Warnings:

* ares-ide is no more working with Node.js 0.8. This regression will be fixed during the next sprint. 
* Detailed instructions in our GitHub https://github.com/enyojs/ares-project/blob/0.2.5/KNOWN-BUGS.md

Ares Sprint 15 Sept 05th- Sept 16th
-----------------------------------

**Release: ares-ide 0.2.4**

Brief:

* ENYO-1769, ace editor: search and replace is difficult to use
* ENYO-2038, Ares Designer: Designer enters "edited" state when opening a document
* ENYO-2264, TabPanels: Add drop-down menu at the right end of the tab bar
* ENYO-2591, When a signing key is chosen for PhoneGap Build, it is for good
* ENYO-2784, Confirm file > save-as when target already exists
* ENYO-2794, Update the generation of the xml tags to define plugins in config.xml
* ENYO-2795, Ares UI needs some "About Ares" menu entry to display the version of Ares IDE
* ENYO-2949, Ares do overwrite the same named file when it generate a new file
* ENYO-2953, PGB errors cause Ares to hang forever
* ENYO-2970, Update enyo, onyx, ... in TipCalc, ... applications
* ENYO-2978, Designer can be messed-up if undo/redo are too fast
* ENYO-2997, Ares Code editor: ctrl-s doesn't save file when back from designer
* ENYO-3013, DataChart: integrate Chert library in Ares palette
* ENYO-3014, Ares: Create & publish ares-0.2.3
* ENYO-3017, Ares: add a logo icon to ares
* ENYO-3021, Hide un-implemented Designer "Filter" palette onyx.Input
* ENYO-3022, Update ACE to the latest version
* ENYO-3023, Phonegap build panel should have a link to Phonegap documentation
* ENYO-3042, Project properties NOT saved on create project
* ENYO-3064, Integrate SampleEBC
* ENYO-3072, Ares roadmap PPT
* ENYO-3073, Kind auto complete within editor broken
* ENYO-3081, Ares: EnyoJS API viewer launched in a browser tab
* ENYO-3086, Unable to duplicate a project: error 400
* ENYO-2441, Code editor: behavior enhancement of find/replace popup
* ENYO-2968, PhoneGapBuild permissions not taken into account in built app
* ENYO-3012, Bad assets path when deploying a non-bootplate-like Enyo application
* ENYO-3018, Ares: Create & Test pre package ares-0.2.4
* ENYO-3045, Phonegap build signing keys are lost even if present in the project.json
* ENYO-3090, genzip: allow to remove a template source thru ide-plugin.json
 
Warnings:

* We still have drap and drop issues using IE, FF browsers. 
* It works fine using Chrome either on Windows 7, Linux and MAC OS/X.


Ares Sprint Aug 15th - Sept 09th
--------------------------------

* Nothing was published since 0.2.1, which was a summer half-baked toy (many fixes, but too many regressions). 
* Sadly, 0.2.2 was in the same state.

**Release: ares-ide 0.2.3**

Brief:

* bug fixes and enhancements about Phonegap build,
* bug fixes about Project file management,
* bug fixes about drag & drop either in File management and Designer, and,
* enhancement about Ares IDE UI

Details:

* ENYO-1564, Ares cannot save files on Debian GNU/Linux
* ENYO-1741, Ares: pop account setup window in case of authentication failure
* ENYO-2329, Ares: PhoneGap Build does not work for SSO-ed GitHub accounts
* ENYO-2386, build a parser for retrieving css properties in stylesheet
* ENYO-2521, Ares project preview window In Internet Explorer 10 is not resizable
* ENYO-2525, Preview button in Editor & Design Mode
* ENYO-2689, Ares IDE incorrectly create folders with special characters in folder name
* ENYO-2756, Double click on file sometimes fails to open file
* ENYO-2771, Bugs in create New file with with existing name
* ENYO-2778, analyser blows up on half nested comments
* ENYO-2779, Ares Panels: code editor resize needed if word wrap is active
* ENYO-2782, Ares Tab Panels: open icon.png file on IE
* ENYO-2806, Project.json is created too early in the project creation process
* ENYO-2821, The AppId input in "Phonegap UI" should be replaced by a picker	Task
* ENYO-2833, add layout, data update and resizing to d3 PieChart
* ENYO-2877, Hook Ares to Travis CI
* ENYO-2879, Make Ares npm test run on Windows too
* ENYO-2886, Ares : project creation issue when directory had not been expanded
* ENYO-2904, Failure during "npm -d install"
* ENYO-2934, Update ares demo script to use ares-0.2.2-x
* ENYO-2937, Clean and comment PieChart and Barchart
* ENYO-2955, Create release scripts to update package.json a regular manner
* ENYO-3002, Fix icon path in TweetSearch following changes coming from ENYO-2775
* ENYO-1503, Ares: on-server deploy.js should use Enyo version that comes with the project
* ENYO-1768, Ares phonegap build: onyx .png files are included in the apk but not found by the application
* ENYO-2674, Dropbox invisible feature till it will be enable in the ide.json
* ENYO-2775, designer: 404 error when trying to load icons of application
* ENYO-2786, Ares Hermes File Tree : DND is broken on IE10
* ENYO-2799, onyx.DatePicker fails to be re-rendered by the Designer after modifyProperty
* ENYO-2800, If an exception is catch when Design render a specified kind, a reloadNeeded should be executed
* ENYO-2809, Improve file close error on ARES
* ENYO-2883, Build Vanilla Bootplate on Update = File is too large
* ENYO-2899, Prefer to deploy/minify on manifest (deploy.json) rather than script (js|cmd|bat|sh)
* ENYO-2901, Re-enable Ares mocha test suite
* ENYO-2902, re-enable enyo.TestRunner Ares test suite
* ENYO-2942, Deleting any component removes enyo.DataRepeater children
* ENYO-2974, Components no longer selectable in Designer iframe with latest enyo
* ENYO-2986, Uncaught exception: Cannot read property 'status' of undefined Ares.js:494
* ENYO-3003, TipCalc: Allow application icon in phonegap build
* ENYO-3024, "File Already Exists" when running PhoneGap build in Ares

Warnings: 

* We still have drap and drop issues using IE, FF browsers. 
* It works fine using Chrome either on Windows 7, Linux and MAC OS/X. Detailed instructions in our GitHub https://github.com/enyojs/ares-project/blob/0.2.3/KNOWN-BUGS.md


Ares Sprint Jul 24th - Aug 14th
-------------------------------

**Release: ares-ide 0.2.1**

Brief:

* Ares can now launch a phonegap build on an new or empty phonegap account
* Generation of config.xml can now be disabled. 
* Customization in config.xml won't be clobbered by Ares when launching a build

Details:

* ENYO-1767, Ares phonegap build uploads all enyo/onyx .js files
* ENYO-1994, Ares: node-zipstream reports buggy events
* ENYO-2063, Ares should work on Node.js 0.10.x
* ENYO-2361, With FF version 20.0, code editor button on designer is not correctly placed
* ENYO-2485, Designer: A style "padding-right: 50px; padding-top: .3em" causes an issue in CSS editor
* ENYO-2512, Ares: Selecting the application icon should raise a FileManager
* ENYO-2605, Continue jshint warning/error cleanup
* ENYO-2692, Lookup features offered by Bracket PhoneGap Build plugin
* ENYO-2710, Ares: when a project is removed, its opened files are not closed
* ENYO-2745, Unify BarChart and StackBarChart + Expand layout + data update
* ENYO-2747, Ares Panels: make more ergonomic the last panel
* ENYO-2762, Ares should let the developer edit the file config.xml
* ENYO-2770, Ares Hermes Files Tree : change look of the big black banner
* ENYO-2783, New npmjs tagged 0.2.1 that will contain fixes from issue ENYO-2781
* ENYO-2797, Ares Panels: "Save as" action switch the way of filetree's slide button
* ENYO-2804, FileChooser: Input text width is too small related to the area
* ENYO-2832, ares shoud use semver as an NPM module, not a Git sub-module
* ENYO-2835, Panels are not working on IE9
* ENYO-2843, Ares: replace JSON.parse|stringify by enyo.json.parse|stringify
* ENYO-2868, Option data of .design files must be provided to Deimos when creating a new item
* ENYO-2894, Wrong chart size when not in the first visible Panel

Warning:

* See detailed instructions in our GitHub https://github.com/enyojs/ares-project/blob/0.2.1/KNOWN-BUGS.md

Ares Sprint Jul 13th - Jul 24th
-------------------------------

**Release: ares-ide 0.2.0**

Brief:

* Improved new Ares layout (to be continued)
* Improved designer (to be continued)
* Improved file manager (to be continued)
* Improved phonegap build UI within Ares (to be continued)
* Proxy can be configured in ide.json 
* Designer (drag&drop) issue is now fixed and working with Chrome Browser. This issue is not yet fixed for other browsers.

Details:

* ENYO-2513, Selecting the page for previewing the app should raise a FileManager
* ENYO-2523, 2D area chart using D3js focusing on layouts
* ENYO-2528, FileChooser: project filetree navigation improvement
* ENYO-2596, Ares Editor Settings : high light active line true
* ENYO-2618, Improve App-Catalog performance (use less alpha channel)
* ENYO-2621, Uncaught TypeError: Cannot read property '__aresOptions' of null
* ENYO-2708, Phobos: In save Popup, the save button is missing
* ENYO-2709, Ares: Publish on npmjs ares-ide tagged 0.1.7
* ENYO-2724, Display the configuration parameters values from "project.json" When the UI "Phonegap Build" is displayed
* ENYO-2725, Ares: reduce padding on onyx picker in CssEditor.css
* ENYO-2743, factorize css rules to apply the same style to all charts in d3 sampler
* ENYO-2369, as a user, I can switch files with tabs with a desktop look
* ENYO-2425, Phonegap build fails if the app-id does not exist in the phonegap build account
* ENYO-2723, Project Properties: Button triggering a file chooser should indicate if the path is broken
* ENYO-2732, Not able to download built packages through a proxy from PhoneGap when Ares is behind a firewall
* ENYO-2733, ProjectProperties popup fails at hiding behind Project create popup
* ENYO-2746, ondragstart, ondrag and ondragfinish events should not be bubbled up to Ares panels
* ENYO-2748, Editor: panel is disappearing instead of closing
* ENYO-2749, FileManager: Scrollbar is missing when the navigator window is maximized

Warning:

* A list of known issues with their work-around (if any) was created. See detailed instructions in our GitHub https://github.com/enyojs/ares-project/blob/0.2.0/KNOWN-BUGS.md

Ares Sprint Jun 27th - Jul 12th
-------------------------------

**Release: ares-ide 0.1.7**

Brief:

* New ares layout based on panels and tabs
* Improved designer (to be continued)
* Improved file manager (to be continued)
* Better visual design (to be continued)

Details:

* ENYO-1336, HermesFileTree: new dir or files are displayed at the bottom (out of order)
* ENYO-1908, Ares: every file-op causes a double refresh of the file-tree view (HermesFileTree)
* ENYO-2494, HermesFileTree: As a folder node is created, focus is not put on the brand new node
* ENYO-2496, Project manager: "Package.js" file is created anytime a new folder is created
* ENYO-2619, Prepare and attend IDE workshop
* ENYO-2624, Report EP issues found during Discover preparation
* ENYO-2629, Ares Preview : use CSS classes instead of style
* ENYO-2630, Ares Less : manage path for onyx variables
* ENYO-2688, Update needed after migration from HPACS to hp-ws github organization
* ENYO-2693, Ares Panels : no event when the last of files in code editor is closed
* ENYO-2696, Investigation for how to release Ares as a product
* ENYO-2703, Ares Panels: project menu is hidden under harmonia panel
* ENYO-2705, Make sign-in popup persistent in App-Catalog client
* ENYO-2311, TabPanels: create samples for TabPanels widget
* ENYO-2368, CSS style editor: 3rd step: Color picker
* ENYO-2432, Generate the file "config.xml" from the "Phonegap build" Project-Properties panel
* ENYO-2500, File manager: close an opened file right before dragging it
* ENYO-2615, Setup ares ui component registry
* ENYO-2616, Turn Ares into full panel layout
* ENYO-2685, Phonegap build fails on minification with external libraries.

Warning:

* Designer freeze may appears when opening several files coming from different project. WA is reload ares.
* See JIRA https://enyojs.atlassian.net/browse/ENYO-2729.

Ares Sprint Jun 13th - Jun 26th
-------------------------------

**Release: ares-ide 0.1.6**

Brief:

* Designer (ability to build more complex applications & allow a brand new non-HTML "absolute layout")
* File-management (fixing drag-and-drop bugs)
* Theming Ares (now using Less)
* Plugin API's (more flexible definition of the sources when generating a new application)
* PhoneGap Build (Ares now automatically downloads built packages).

Warning: 

* PhoneGap Build of webOS is currently broken. The issue is in PGB itself, not in Ares2. It will be reported to Adobe/PGB.

Details:

* ENYO-1894, Project Preview does not work if folder on path has a space like "New Folder"
* ENYO-2190, Ares PhoneGap build: behavior of the PhoneGapBuild checkbox in creating and settings screen
* ENYO-2479, PhoneGap build panels no longer show up in ProjectProperties
* ENYO-2526, Add stacked layout for the D3js-barchart
* ENYO-2527, Test css styling on mobile
* ENYO-2559, Renaming Ares.Node in Hermes.Node
* ENYO-2570, Prepare jshint and Travis CI integration
* ENYO-2571, After a Drag and Drop, the file manager panel is shifted up
* ENYO-2575, "Scroller.scrollIntoView" method performs an unexpected behaviour on another Scroller object 

Ares Sprint May 30th - Jun 12th
-------------------------------

**Release: ares-ide 0.1.5**

Brief:

* Install & update as usual via NPM ("npm install ares-ide" or "npm update ares-ide"
* No, node-0.10.x is not yet supported, but we have some good changes...
* Continued our CSS polishing work
* Improved stability, especially against time-outs
* It is now possible to develop Ares using Ares (thank you @microtech)
* Project-View (Harmonia):
* You project can now include spaces in its name... as can any of your files or folders.
* Drag-and-Drop of files & folders in our file-manager (w/ package.js automatic update, as usual)
* Edit > Duplicate duplicates an existing project, so that you can use your own work as template
* PhoneGap Build (Harmonia):
* Assets are now properly embedded in the packages.
* Packages are larger as we are trying to kill a minification issue (not yet fixed), but this change also fixed a lot of platform-specific issues. You may want to re-test your past PGB issues with this new release.
* Works behind an HTTP proxy
* Designer (Deimos):
* Huge amount of small bugs were fixed. Drag & drop from the Components & Control Palette is much improved
* We added a small CSS styling helper in the right pane, to help for rapid prototyping

Details:

* ENYO-2423, Create installation helpers for Ares demo on vanilla Windows
* ENYO-2443, Improve WebGL POC introducing visual 3D effects
* ENYO-2444, 2D line chart using D3js focusing on layouts
* ENYO-2445, 2D pie chart using D3js focusing on layouts
* ENYO-2466, Ease edition of Ares within Ares
* ENYO-2468, Ares & Plugins: Update NPM dependencies
* ENYO-2044, Ares+PhoneGap build may fail with "Too Many open Files"
* ENYO-2151, As an app developer, I can use drag-and-drop to move files/folders within a single project
 


Ares Sprint 14 May 15th - May 29th
----------------------------------

Release: ares-ide 0.1.4

Brief:

* PhoneGap build feature restored.  Much faster & now working on Windows with deep folder structures.
* Improved designer (to be continued)
* Improved file manager (to be continued)
* Better visual design (to be continued)
* Split README.md into README.md (use Ares to develop applications) and CONTRIBUTE.md (Contribute to Ares).

Details:

* ENYO-1946, Designer (general): Drag and drop components into container with absolute layout 
* ENYO-2307, Ares: rebuilding an application using PhoneGap Build is broken
* ENYO-2179, AAAD, I can use visual editors for common CSS style properties in the designer 
* ENYO-1030, AAAD, I can set Code editor Preferences 
* ENYO-2223Ares Designer (or Phobos) should report error to user when the components block contains function properties (which are not currently supported)
* ENYO-2232, AAAD, I can see EP visual design in Ares - Part 1 
* ENYO-2341, Placeholder: identify improvements needs for file manager 
* ENYO-2360, Ares Code editor: define and select code editor preferences
* ENYO-2350, Ares PhoneGap configuration should put the label "App ID" instead of "AppId"
* ENYO-2306, Ares: switch to official phonegap node.js client library
* ENYO-2151, As an app developer, I can use drag-and-drop to move files/folders within a single project 
* ENYO-2415, Ares PhoneGap build cannot handle deep project folder structures (Windows)


Ares Sprint 13 - May 1st - May 14th
-----------------------------------

Release: none

* ENYO-1219,	Designer: Allow drop targets "before"/"after" components (in addition to "into")
* ENYO-2154,	As an app developer, I can save the currently edited file as a new file within the project

Ares Sprint 12 - Apr 15th - Apr 30th
------------------------------------

Release: ares-ide 0.1.3
