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
_platforms = {
         android:    {name:"android", ext: 'apk', idx: 0},
         blackberry: {name:"blackberry", ext: 'jad', idx: 1}, //signed. Extension for unsigned blackberry applications is 'zip'
         ios:        {name:"ios", ext: 'ipa', idx: 2},
         symbian:    {name:"symbian", ext: 'wgz', idx: 3},
         webos:      {name:"webos", ext: 'ipk', idx: 4},
         winphone:   {name:"winphone", ext: 'xap', idx: 5}
},
/*
 * Returns The extension for the given platform
 */
_getExtByPlatform = function(platformName){
   var result = 'ext'; //default extension
   if(platformName){ //prevent errors
      switch(platformName){
         case 'android':
         case 'blackberry':
         case 'ios':
         case 'symbian':
         case 'webos':
         case 'winphone':
            result = _platforms[platformName].ext; 
            break;
         }
   }
   return result;
}
;

module.exports = {
   platforms: _platforms,
   getExtByPlatform: _getExtByPlatform
};