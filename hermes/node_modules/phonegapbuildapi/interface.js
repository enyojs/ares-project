#!/usr/bin/env node

var 
   _api = require('./phonegapbuildapi'),
   _program = require('commander'),
   _req = require('request'),
   _tools = require('./tools'),
   URL = 'https://build.phonegap.com',
      
   _MENU = 
      {
      getUserData: {name: "Get User Data", idx: 0},
      getAppsData: {name: "Get All Apps Data", idx: 1},
      getAppDataById: {name: "Get App Data by ID", idx: 2},
      getKeysData: {name: "Get Keys Data", idx: 3},
      downloadApp: {name: "Download App", idx: 4},
      quit:  {name: "Quit", idx: 5}
      },
      
   _token = null,
   
/******************************************************************
 * Gracefully ends the program, relinquishing control of std input
 *****************************************************************/
quit = function(){
   process.stdin.destroy();
},

/******************************************************************
 * Standard Error handler. Prints error message (if any) on stdout
 *****************************************************************/
stdErrorHandler = function(errorMsg){
   if(errorMsg){
      console.log(errorMsg);
   }
   else{
      console.log("Unknown Error");
   }
   showMenu();
},

/******************************************************************
 * Processes user's menu selection
 *****************************************************************/
doMenuOption = function (menuOption){
   var i;
   switch(menuOption){
      case _MENU.getUserData.idx:
      
         _api.getUserData(_token, {success: function(data){
            console.log(data);
            showMenu();
            }, error: stdErrorHandler});
         break;
         
      case _MENU.getAppsData.idx:
      
         _api.getAppsData(_token, {success: function(data){
            console.log(data);
            showMenu();
            }, error: stdErrorHandler});
         break;
      case _MENU.getAppDataById.idx:
      
         _program.prompt("App ID: ", function(appId){
            _api.getAppDataById(_token, appId, {success: function(data){
               console.log(data);
               showMenu();
               }, error: stdErrorHandler});
         });
         break;
      case _MENU.getKeysData.idx:
      
         _api.getKeysData(_token, {success: function(data){
            console.log(data);
            showMenu();
            }, error: stdErrorHandler});
         break;
      case _MENU.downloadApp.idx:
      
         _program.prompt("App ID: ", function(appId){
            
            var platformList=[], platformKeys = Object.keys(_tools.platforms);
            for(i=0; i<platformKeys.length; i++){platformList.push(_tools.platforms[platformKeys[i]].name);}
            
            console.log('\nPlatform:');
            _program.choose(platformList, function(platformIdx){
            
               _program.prompt("Output filepath: ", function(outFpath){
                  _api.downloadApp(_token, appId, platformList[platformIdx], outFpath, {success: function(data){
                     console.log("File successfully downloaded to: " + data);
                     showMenu();
                     }, error: stdErrorHandler});
                  });
               });
            
            });
      
         break;
      case _MENU.quit.idx:
         quit();
         break;
      default:
         showMenu();
         break;
   }
}

/******************************************************************
 * Displays Menu
 *****************************************************************/
showMenu = function(){
   
   console.log('\n\nPlease choose one of the following options');
   var menuList = [], menuKeys = Object.keys(_MENU);
   for(var i=0; i<menuKeys.length; i++){menuList.push(_MENU[menuKeys[i]].name);}
   
   _program.choose(menuList, function(menuOption){
      doMenuOption(menuOption);
   });
},

/******************************************************************
 * Executes login by requesting an authentication token from the server
 *****************************************************************/
doLogin = function(loginCredentials){
   _api.createAuthToken(loginCredentials, {success: function(token){
      _token = token;
      showMenu();
      }, 
      error: function(errMsg){
         stdErrorHandler(errMsg);
         quit();
      }});
},

/***************************************************
 * Prompts user for login credentials
 ****************************************************/
getLoginCredentials = function(){
   _program.prompt("Phonegap Build Username: ", function(username){
      _program.password("Password: ", "*", function(password){
         doLogin(username.trim()+":"+password.trim());
      });
   });
},

/************************************************************
 * Initialize the program when no options have been selected
 ***********************************************************/
stdInit = function(){
   getLoginCredentials();
};

/*
 * Program Starts here!
 */
_program
   .version('0.0.1')
   .option('-u, --user <username:pwd>', 'Specify login credentials', String, '')
   .parse(process.argv);

if(_program.user){
   doLogin(_program.user);
}
else{
   stdInit();
}


