/**************************************************************************
 * Copyright (c) 2012 Adtec Productions, Inc.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 * 
 *      http://www.apache.org/licenses/LICENSE-2.0
 *      
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **************************************************************************/

var 
_URL = 'build.phonegap.com',
_fs = require('fs'),
_https = require('https'),
_mime = require('mime'),
_req = require('request'),
_URL = 'build.phonegap.com'

/******************************************************************
 * Executes the GET Phonegap API call,
 * and writes the output in a JSON-formatted file
 ******************************************************************/
getApiData = function(token, apiCall, callback){
   var
   options = null;
   
   options = {
      host: _URL,
      path: '/api/v1/' + apiCall + '?auth_token='+token
      };
   
   _https.get(options, function(res){
      var replyData = '';
      res.on('data', function(data){
         replyData+= data;
         });
      res.on('end', function(){
         if(callback instanceof Function){
            callback(JSON.parse(replyData));
            }
         else if (callback.success instanceof Function){
            callback.success(JSON.parse(replyData));
            }
         });
      }).on('error', function(e){
         console.log("AJAX Err. Message: " + e.message);
         if(callback.error && (callback.error instanceof Function)){callback.error(e.message);}
      });
   },

/******************************************************************
 * Downloads the file at the given URL and saves it in the provided
 * path.
 ******************************************************************/   
downloadFile = function(url, outputFilepath, callback){
   var successCallback = (callback instanceof Function)? callback: (callback.success instanceof Function)? callback.success: function(){};
   var errCallback = (callback.error instanceof Function)? callback.error: function(){};
   
   _req.get(url).pipe(_fs.createWriteStream(outputFilepath))
      .on('error', function(e){errCallback(e.message);})
      .on('close', function(){successCallback(outputFilepath)});
},
   
/******************************************************************
 *  Get a JSON-encoded representation of the authenticated user, 
 *  as well as a listing of associated resources.
 *  
 *  This should be the starting point for applications traversing 
 *  the PhoneGap Build API. It is aliased to 
 *  https://build.phonegap.com/api/v1.
 *  
 *  GET https://build.phonegap.com/api/v1/me 
 *****************************************************************/   
_getUserData = function(token, callback){
   getApiData(token, 'me', callback);
},

/******************************************************************
 *  Get a JSON-encoded representation of the authenticated user's 
 *  apps.
 *  
 *  API clients can follow the link attribute for each app to get 
 *  further details, including the associated signing keys and 
 *  collaborators.
 *  
 *  GET https://build.phonegap.com/api/v1/apps 
 *****************************************************************/ 
_getAppsData = function(token, callback){
   getApiData(token, 'apps', callback);
   },

   
/******************************************************************
 *  Get a JSON-encoded representation of a particular app, if the 
 *  authenticated user has permission to access it.
 *  
 *  In addition to the fields provided in the list of all apps, 
 *  this detail view includes:
 *  
 *  keys: all of the keys that the app is currently being built with. 
 *    This will include the owner's default key for a platform, 
 *    if selected
 *    
 *  collaborators: each person who has access to this app, along 
 *    with their role, if the authenticated user is the owner of 
 *    the app. Collaborators who are registered with PhoneGap Build 
 *    are listed under active; collaborators you have invited who 
 *    have not yet created an account are listed as pending.
 *  
 *  GET https://build.phonegap.com/api/v1/apps/:id 
 *****************************************************************/
_getAppDataById = function(token, appId, callback){
   getApiData(token, 'apps/' + appId, callback);
   },

/******************************************************************
 *  Get a JSON-encoded list of all the signing keys associated with 
 *  your account.
 *  
 *  This returns a short listing of all the associated keys--it's 
 *  very similar to the list you'll see when requesting /api/v1/me
 *  
 *  GET https://build.phonegap.com/api/v1/keys 
 *****************************************************************/
_getKeysData = function(token, callback){
   getApiData(token, 'keys', callback);
   },
   
   
/******************************************************************
 *  Get a JSON-encoded list of all the signing keys associated with 
 *  your account, for a specific platform. That platform can be one
 *  of ios, android, or blackberry.
 *  
 *  GET https://build.phonegap.com/api/v1/keys/:platform 
 *****************************************************************/
_getPlatformKeys = function(platform){
   getApiData('keys/' + platform, METADATA_DIR + '/keys_' + platform + '.json');
   },
   
/******************************************************************
 *  Get a JSON-encoded representation of a single signing key.
 *  
 *  GET https://build.phonegap.com/api/v1/keys/:platform/:appId 
 *****************************************************************/
_getPlatformKeyById = function(platform, appId){
   getApiData('keys/' + platform + '/' + appId, METADATA_DIR + '/keys_' + platform + '_' + appId + '.json');
   },

/******************************************************************
 *  Download the app package for the given platform; available 
 *  platforms are android, blackberry, ios, symbian, webos and 
 *  winphone.
 *  
 *  In the successful case, this API method will return a 302 
 *  redirect to the application binary - the actual body of the 
 *  response will point to the resource's correct location:
 *  
 *  If using the optional argument for the download location,
 *  please ensure that you are using the right extension for
 *  the platform you are downloading. 
 *  
 *  apk for Android
 *  ipa for iOS
 *  ipk for webOS
 *  jad for unsigned BlackBerry builds; zip if you've uploaded your BlackBerry signing keys
 *  wgz for Symbian
 *  xap for Windows Phone
 *  
 *  GET https://build.phonegap.com/api/v1/apps/:id/:platform 
 *****************************************************************/
_downloadApp = function(token, appId, platform, outputFilepath, callback){
   var url= 'https://' + _URL + '/api/v1/apps/' + appId + '/' + platform + '?auth_token='+token;
   console.info("\n\nStarting Download...");
   downloadFile(url, outputFilepath, callback);
   },
   
/*****************************************************************
 * Get the main icon associated with an app - this is either the 
 * biggest icon specified in your config.xml file, or an icon you 
 * have uploaded through the API or the PhoneGap Build web interface.
 * 
 * GET https://build.phonegap.com/api/v1/apps/:id/:icon
*****************************************************************/
_downloadIcon = function(token, appId, outputFilepath, callback){
   var url= 'https://' + _URL + '/api/v1/apps/' + appId + '/icon';
   downloadFile(url, outputFilepath, callback);
   },
   
/************************************
 * Init Write API
 */
   



encodeFieldHeader = function(boundary, name, value){
   var result = [
     "--" + boundary + "\r\n",
     "Content-Disposition: form-data; name=\"", 
     "" + name + "\"\r\n\r\n" + value + "\r\n",
     ].join("");
   return result;
},

encodeFileHeader = function(boundary, type, name, filename){
   var result = [
      "--" + boundary + "\r\n",
      "Content-Disposition: form-data; name=\"" + name + "\"; filename=\"" + filename + "\"\r\n",
      "Content-Type: " + type + "\r\n\r\n"
     ].join("");
   return result;
},


postMultipart = function(token, postData, boundary, apiCall, callback){
   var 
   len = 0, i=0,
   options = null, 
   request = null;
   
   for( i=0; i<postData.length; i++){
      len += postData[i].length;
   }
   
   options = {
      host: _URL,
      path: '/api/v1/' + apiCall + '?auth_token='+token,
      method: 'POST',
      headers:{
         'Content-Type': 'multipart/form-data; boundary=' + boundary,
         'Content-Length': len
      }
   };
   
   request = _https.request(options, function(response){
      var replyData = '';
      response.on('data', function(chunk){
         replyData+= chunk;
      });
      response.on('end', function(){
         if(callback instanceof Function){
            callback(replyData);         
            }
         else if(callback.success instanceof Function){
            callback.success(replyData);
            }
         return;
      });
      response.on('error', function(e){
         if(callback.error instanceof Function){
            callback.error(e.message);
            }
         return;
      });
   });
   
   for( i=0; i<postData.length; i++){
      request.write(postData[i]);
   }
   request.end(); 
   
},

initMultipartUpload = function(token, inputFile, reqData, apiCall, fieldName, callback){
   var  
   boundary = 'bound' + Math.random(),
   postData = [], 
   fileReader = null,
   fileContents = '';
   
   if(reqData){postData.push(new Buffer(encodeFieldHeader(boundary, "data", JSON.stringify(reqData)), 'ascii'))};
   postData.push(new Buffer(encodeFileHeader(boundary, _mime.lookup(inputFile), fieldName, inputFile), 'ascii'));
   fileReader = _fs.createReadStream(inputFile, {encoding: 'binary'});
   fileReader.on('data', function(fileData){ fileContents+= fileData;});
   fileReader.on('end', function(){
      postData.push(new Buffer(fileContents, 'binary'));
      postData.push(new Buffer("\r\n--" + boundary + "--", 'ascii'));
      postMultipart(token, postData, boundary, apiCall, callback);
      });
},

 
 /******************************************************************
 *
 *  Create a new File-based App.
 *  
 *  Required parameters
 *  
 *  title: You must specify a title for your app - if a title is also 
 *         specified in a config.xml in your package, the one in the 
 *         config.xml file will take preference.
 *  create_method: use "file" for this method
 *  
 *  Optional parameters
 *  
 *  package: Sets the package identifier for your app. This can also be 
 *           done after creation, or in your config.xml file. 
 *           Defaults to com.phonegap.www
 *  version: Sets the version of your app. This can also be done after 
 *           creation, or in your config.xml file. Defaults to 0.0.1
 *  description: Sets the description for your app. This can also be 
 *               done after creation, or in your config.xml file. 
 *               Defaults to empty.
 *  debug: Builds your app in debug mode. Defaults to false.
 *  keys: Set the signing keys to use for each platform you wish to sign. 
 *  private: Whether your app can be publicly downloaded. Defaults to 
 *           true during beta period; will default to false once the 
 *           beta period is complete
 *  phonegap_version: Which version of PhoneGap your app uses. See 
 *                    config.xml for details on which are supported, 
 *                    and which one is currently the default
 *  
 * File-backed applications
 * 
 * To create a file-backed application, set the create_method parameter 
 * to file, and include a zip file, a tar.gz file, or an index.html 
 * file in the multipart body of your post, with the parameter name file.
 * 
 *    POST https://build.phonegap.com/api/v1/apps
 *****************************************************************/ 
_createFileBasedApp = function(token, inputFile, dataObj, callback){
   initMultipartUpload(token, inputFile, dataObj, 'apps', "file", callback);
},

/******************************************************************
 *    Updating a file-based application
 *    
 *    If the application has been created from a file upload, you 
 *    can include a new index.html, zip file, or tar.gz file as the 
 *    file parameter in your request to update the contents.
 *   
 *    PUT https://build.phonegap.com/api/v1/apps/:id
 *****************************************************************/
_updateFileBasedApp = function(token, inputFile, appId, callback){
   var apiPath = '/api/v1/apps/' + appId + '?auth_token=' + token;
   _fs.createReadStream(inputFile).pipe(_req.put('https://build.phonegap.com' + apiPath))
   .on('error', function(e){if(callback.error instanceof Function){callback.error(e.message);}})
   .on('end', function(){
      if(callback instanceof Function){
         callback();
         }
      else if (callback.success instanceof Function){
         callback.success();
         } 
      });
   
},

/******************************************************************
 * POST https://build.phonegap.com/api/v1/apps/:id/:icon
 * 
 * Sets an icon file for a given app. Send a png file as the icon 
 * parameter in your post.
 * If you want to have multiple icons for different resolutions, you 
 * should not use this API method. Instead, include the different 
 * icon files in your application package and specify their use 
 * in your config.xml file.
 * 
 * The response will have a 201 created status, and the 
 * application will be queued for building.
******************************************************************/
_uploadAppIcon = function(token, appId, inputFile, callback){
   initMultipartUpload(token, inputFile, null, 'apps/' + appId + "/icon", "icon", callback);
},

/******************************************************************
 * 
 * DELETE https://build.phonegap.com/api/v1/apps/:id
 * 
 * Delete your application from PhoneGap Build - will return either
 * a 202 (accepted) status, or 404 (if the app cannot be found).
 *****************************************************************/
_deleteFileBasedApp = function(token, appId, callback){
   var options = {  
      url : 'https://'+_URL+"/api/v1/apps/" + appId + '?auth_token=' + token
      }; 
      
   _req.del(options, function (error, response, body) {
      if(error){
         if(callback instanceof Function){
            callback("Error deleting app " + appId);
            }
         else if(callback.error instanceof Function){
            callback.error("Error deleting app " + appId);
            }
         }
      else{
      
         if(callback instanceof Function){
            callback(body);
            }
         else if(callback.success instanceof Function){
            callback.success(body);
            }
      }
   });
   
},

/******************************************************************
 * POST https://build.phonegap.com/api/v1/apps/:id/build
 * 
 * Queue new builds for a specified app. The older builds will be 
 * discarded, while new ones are queued.
 * The builds will use the most current app contents, as well as 
 * the selected signing keys. The response will have a 202 (accepted) 
 * status.
 * 
 * To choose which platforms to build, include those as a JSON encoded 
 * parameter in your post
 * 
 * Once the builds are queued, you will want to watch the results of 
 * GET /api/v1/apps/:id to see when each platform's status changes 
 * from pending (to complete or error).
 * 
 ******************************************************************/
//rebuildApp = function(token, appId, dataObj, callback){
//   
//},

_createAuthToken = function(rawCredentials, callback){
   var
   auth = "Basic " + new Buffer(rawCredentials).toString("base64"),
   options = {  
      url : 'https://'+_URL+"/token",    
      headers : { "Authorization" : auth } 
      }; 
   
   _req.post(options, function (error, response, body) {
      if((error!==null) || (response.statusCode!=200))
         {
         var errStr = "AJAX error.  Your request could not be completed. Please verify your login credentials and network access.  statusCode: " + response.statusCode;
         if(JSON.parse(body) && JSON.parse(body).error){errStr +="\n" + JSON.parse(body).error;}
         if(callback.error instanceof Function){callback.error(errStr);}
         return;
         }
      if(callback instanceof Function){
         callback(JSON.parse(body).token);
         }
      else if(callback.success instanceof Function){
         callback.success(JSON.parse(body).token);
         }
      });
};
   
   

   
/******************************************************************
 *  Module Public Members
 *****************************************************************/
module.exports = {
   //Read API
   getUserData: _getUserData,
   getAppsData: _getAppsData,
   getAppDataById: _getAppDataById,
   getKeysData: _getKeysData,
   getPlatformKeys:_getPlatformKeys,
   getPlatformKeyById: _getPlatformKeyById,
   downloadApp: _downloadApp,
   downloadIcon:_downloadIcon,
   
   //Write API
   createFileBasedApp:_createFileBasedApp,
   updateFileBasedApp:_updateFileBasedApp,
   uploadAppIcon: _uploadAppIcon,
   deleteFileBasedApp: _deleteFileBasedApp,
   createAuthToken: _createAuthToken
};