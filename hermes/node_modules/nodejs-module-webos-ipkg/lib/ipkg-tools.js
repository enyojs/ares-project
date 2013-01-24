var shell = require("shelljs");

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

    openwebos.registerRemoteTemplates = function(templatesUrl) {
        newTemplates.forEach(function(entry) {
            templates[entry.id] = entry;
        });
    };
    openwebos.list = function(callback) {
        callback(null, templates);
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
                // console.log("LS -R: " + file);

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

        // console.log("generate: substitutions: ", substitutions);
        callback(null, filelist);
    };

    applyJsonSubstitutions = function(filename, values) {
        var modified = false;
        var content = shell.cat(filename);
        // console.log("CONTENT: >>" + content + "<<");
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
            // console.log("WRITING NEW CONTENT: >>" + newContent + "<<");
            newContent.to(filename);
        }
    };

    applySedSubstitutions = function(filename, changes) {
        changes.forEach(function(change) {
            // console.log("SED change from >>" + change.search + "<< to >>" + change.replace + "<<");
            shell.sed('-i', change.search, change.replace, filename);
        });
    };
}());

