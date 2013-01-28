var shell = require("shelljs"),
    request = require('request'),
    fs = require("fs"),
    unzip = require('unzip');

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

        // Issue an http request to get the template definition
        request(templatesUrl, function (error, response, body) {
            if (!error && response.statusCode == 200) {                       // TODO: finalyze error handling
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

        // Create an extractor to unzip the template
        var extractor = unzip.Extract({ path: destination });
        extractor.on('error', function(err) {
            console.log("Extractor ERROR: err= ", err);
            callback("Extractor ERROR: err=" + err, null);
        });

        // Building the zipStream either from a file or an http request
        var zipStream;
        if (source.substr(0, 4) === 'http') {
            zipStream = request(source);
        } else {
            zipStream = fs.createReadStream(source);
        }

        // Pipe the zipped content to the extractor to actually perform the unzip
        zipStream.pipe(extractor);
        
        // Wait for the end of the extraction
        extractor.on('close', performSubstitution);

        function performSubstitution(err) {
            if (err) {
                callback("An error occured: " + err, null);
                return;
            }

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

            // Return the list of extracted files
            var filelist = shell.find(destination);
            callback(null, filelist);
        }
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
