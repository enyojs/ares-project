# PHONEGAP BUILD JS
 
### A client interface for the Phonegap Build API using nodejs

## Install

<pre>
  npm install phonegapbuildapi
</pre>

Or from source:

<pre>
  git clone git://github.com/germallon/phonegapbuildapi.git 
  cd phonegapbuildapi
  npm link
</pre>

##Description
Phonegap Build API is a client interface for the <a href="https://build.phonegap.com/docs/api">Phonegap Build API</a> (Duh!).  Given that the API interacts using JSON-formatted strings, Javascript seems like the logical choice to process its input and output.

A commandline interface that partially implements the API has been provided.  
<pre>
   node interface.js
</pre>

The interface allows you to interact with the API, but it is mainly provided to serve as an example on how to use the tool.  You are encouraged to implement your own driver that fits your needs.  

##Examples

###Simple Example
Here's an example on how to display the user data on standard output:

<pre>
   var api = require('phonegapbuildapi');

   api.createAuthToken("my@email.com:myp4ssw0rd", function(token){
      api.getUserData(token, function(userData){
         console.log(userData); //Output user data to stdout
         });         
      });
</pre>

###Error Handling

Error handling is supported through callbacks.  The above example can be expanded to handle any errors found.

<pre>
   var api = require('phonegapbuildapi');

   api.createAuthToken("my@email.com:myp4ssw0rd", {

      success:function(token){
 
         api.getUserData(token, {
            success:function(userData){
               console.log(userData); //Output user data to stdout
               }, 
            error: function(errMsg){
               console.log("Error retrieving user data. Err: " + errMsg);
               }});         
         }, 
 
      error: function(errmsg){
         console.log("Error creating authentication token. Err: " + errmsg);
         }});
</pre>

