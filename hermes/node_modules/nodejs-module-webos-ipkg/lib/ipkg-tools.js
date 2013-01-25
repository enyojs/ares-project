var shell = require("shelljs"),
    request = require('request');

(function () {

    var openwebos = {};

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = openwebos;
    }

    // Hashmap for available templates
    var templates = {};

    /**
     * registerTemplates allow to add new templates to the list
     * of available templates
     * @param newTemplates: array of local templates to add
     */
    openwebos.registerTemplates = function(newTemplates) {
        newTemplates.forEach(function(entry) {
            templates[entry.id] = entry;
        });
    };

    openwebos.registerRemoteTemplates = function(templatesUrl, callback) {

        // console.log("Getting remote templates: " + templatesUrl);

        request(templatesUrl, function (error, response, body) {
          if (!error && response.statusCode == 200) {
            // console.log("BODY >>" + body + "<<");
            try {
                var newTemplates = JSON.parse(body);

                newTemplates.forEach(function(entry) {
                    // console.log("Adding remote template: " + entry.id);
                    templates[entry.id] = entry;
                });
                callback(null, {done: true});
            } catch(err) {
                console.log("Unable to retrieve remote template definition. error=" + err);
                callback("Unable to retrieve remote template definition. error=" + err);
            }
          }
        });
    };

    openwebos.list = function(callback) {
        var keys = Object.keys(templates);
        var answer = [];
        keys.forEach(function(key) {
            answer.push(templates[key]);
        });
        callback(null, answer);
    };

    openwebos.generate = function(templateId, substitutions, destination, options, callback) {

        var source = templates[templateId] && templates[templateId].url;
        if ( ! source) {
            callback("Requested template does not exists", null);
            return;
        }

        // Unzip the template       // TODO: move to javascript
        var result = shell.exec("unzip " + source + " -d " + destination);
        // console.log("shell.exec: ", result);

        // Apply the substitutions
        if (substitutions) {
            shell.ls('-R', destination).forEach(function(file) {

                substitutions.forEach(function(substit) {
                    var regexp = new RegExp(substit.fileRegexp);
                        if (regexp.test(file)) {
                        var filename = destination + "/" + file;
                        if (substit.json) {
                            // console.log("Applying JSON substitutions to: " + file);
                            applyJsonSubstitutions(filename, substit.json);
                        }
                        if (substit.sed) {
                            // console.log("Applying SED substitutions to: " + file);
                            applySedSubstitutions(filename, substit.sed);
                        }
                    }
                });
            });
        }

        var filelist = shell.find(destination);
        callback(null, filelist);
    };

    applyJsonSubstitutions = function(filename, values) {
        var modified = false;
        var content = shell.cat(filename);
        content = JSON.parse(content);
        var keys = Object.keys(values);
        keys.forEach(function(key) {
            if (content.hasOwnProperty(key)) {
                // console.log("JSON change >>" + key + "<< to >>" + values[key]+ "<<");
                content[key] = values[key];
                modified = true;
            }
        });
        if (modified) {
            var newContent = shell.echo(JSON.stringify(content));
            newContent.to(filename);
        }
    };

    applySedSubstitutions = function(filename, changes) {
        changes.forEach(function(change) {
            shell.sed('-i', change.search, change.replace, filename);
        });
    };
}());

