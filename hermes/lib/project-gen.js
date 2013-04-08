var shell = require("shelljs"),
    request = require('request'),
    fs = require("fs"),
    util = require('util'),
    path = require("path"),
    async = require("async"),
    unzip = require('unzip');

(function () {

    var generator = {};

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = generator;
    }

    var objectCounter = 0;

    // Hashmap for available templates
    var templates = {};

    function Generator() {
        this.objectId = objectCounter++;
    }

    generator.Generator = Generator;

    Generator.prototype = {

        /**
         * registerTemplates allow to add new templates to the list
         * of available templates
         * @param {Array} newTemplates: array of local templates to add.
         * Entries must have 'id', 'url' and 'description' properties.
         * @public
         */
        registerTemplates: function(newTemplates) {
            newTemplates.forEach(function(entry) {
                templates[entry.id] = entry;
            });
        },

        /**
         * registerRemoteTemplates allows to fetch templates definition
         * thru http
         * @param  {string}   templatesUrl an http url referencing a json file
         * which contains a array of entries a 'id', 'url' and 'description' properties.
         * @param  {Function} callback(err, status)     commonjs callback. Will be invoked with an error
         *               or a json array of generated filenames.
         * @public
         */
        registerRemoteTemplates: function(templatesUrl, callback) {

            if (templatesUrl.substr(0, 4) === 'http') {
                // Issue an http request to get the template definition
                request(templatesUrl, function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        parseInsertTemplates(body, templatesUrl, callback);
                    } else if (error) {
                        callback("Unable to retrieve remote template definition. error=" + error);
                    } else if (response && response.statusCode >= 300) {
                        callback("Unable to retrieve remote template definition. status code=" + response.statusCode);
                    } else {
                        // Should not be an error case
                    }
                });
            } else {
                fs.readFile(templatesUrl, function(err, data) {
                    if (err) {
                        callback("Unable to read '" + templatesUrl + "' err: " + err);
                        return;
                    }
                    parseInsertTemplates(data, templatesUrl, callback);
                });
            }
        },

        list: function(callback) {
            var keys = Object.keys(templates);
            var answer = [];
            keys.forEach(function(key) {
                answer.push(templates[key]);
            });
            callback(null, answer);
        },

        generate: function(templateId, substitutions, destination, options, callback) {

            if ( ! templates[templateId]) {
                callback("Requested template does not exists", null);
                return;
            }

            // Process all the files
            async.forEachSeries(templates[templateId].zipfiles, processZipFile, notifyCaller);

            function processZipFile(item, next) {
                if (options.verbose) { console.log("Processing " + item.url); }

                async.series([
                        unzipFile.bind(this, item, destination, options),
                        removeExcludedFiles.bind(this, item, destination, options),
                        removePrefix.bind(this, item, destination, options),
                        performSubstitution.bind(this, substitutions, destination, options)
                    ],
                    next);
            }

            function notifyCaller(err) {
                if (err) {
                    callback(err, null);
                    return;
                }

                // Return the list of extracted files
                var filelist = shell.find(destination);
                callback(null, filelist);
            }
        }
    };

    // Private functions
    
    function parseInsertTemplates(data, templatesUrl, callback) {
        try {
            var newTemplates = JSON.parse(data);

            var base = (templatesUrl.substr(0, 4) !== 'http') && path.dirname(templatesUrl);

            newTemplates.forEach(function(entry) {

                entry.zipfiles.forEach(function(zipfile) {
                    if (zipfile.url.substr(0, 4) !== 'http') {
                        zipfile.url = path.resolve(base, zipfile.url);
                    }
                });

                templates[entry.id] = entry;
            });
            callback(null, {done: true});
        } catch(err) {
            callback("Unable to parse remote template definition. error=" + err);
        }
    }

    function unzipFile(item, destination, options, next) {
        var source = item.url;

        if ((source.substr(0, 4) !== 'http') && ( ! fs.existsSync(source))) {
            if (item.alternateUrl) {
                source = item.alternateUrl;
            } else {
                next("ERROR: file '" + source + "' does not exists");
                return;
            }
        }

        if (options.verbose) { console.log("Unzipping " + source + " to " + destination); }

        // Create an extractor to unzip the template
        var extractor = unzip.Extract({ path: destination });
        extractor.on('error', function(err) {
            next("Extractor ERROR: err=" + err);
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
        extractor.on('close', function () {
            next();     // Everything went fine
        });
    }

    function removeExcludedFiles(item, destination, options, next) {
        if (item.excluded) {            // TODO: move to asynchronous processing
            if (options.verbose) { console.log("removing excluded files"); }

            shell.ls('-R', destination).forEach(function(file) {

                item.excluded.forEach(function(pattern) {
                    var regexp = new RegExp(pattern);
                    if (regexp.test(file)) {
                        if (options.verbose) { console.log("removing: " + file); }
                        var filename = path.join(destination, file);
                        shell.rm('-rf', filename);
                    }
                });
            });

            next();
        } else {
            next();             // Nothing to do
        }
    }

    function removePrefix(item, destination, options, next) {
        if (item.prefixToRemove) {
            if (options.verbose) { console.log("removing prefix: " + item.prefixToRemove); }

            var source = path.join(destination, item.prefixToRemove);

            shell.ls(source).forEach(function(file) {
                var target = path.join(source, file);
                shell.mv(target, destination);
            });

            next();
        } else {
            next();             // Nothing to do
        }
    }

    function performSubstitution(substitutions, destination, options, next) {
        if (options.verbose) { console.log("performing substitutions"); }

        // Apply the substitutions                  // TODO: move to asynchronous processing
        if (substitutions) {
            shell.ls('-R', destination).forEach(function(file) {

                substitutions.forEach(function(substit) {
                    var regexp = new RegExp(substit.fileRegexp);
                        if (regexp.test(file)) {
                        var filename = path.join(destination, file);
                        if (substit.json) {
                            if (options.verbose) { console.log("Applying JSON substitutions to: " + file); }
                            applyJsonSubstitutions(filename, substit.json);
                        }
                        if (substit.sed) {
                            if (options.verbose) { console.log("Applying SED substitutions to: " + file); }
                            applySedSubstitutions(filename, substit.sed);
                        }
                    }
                });
            });
        }

        next();
    }

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
            var newContent = JSON.stringify(content, null, 2);
            fs.writeFileSync(filename, newContent);         // TODO: move to asynchronous processing
        }
    };

    applySedSubstitutions = function(filename, changes) {
        changes.forEach(function(change) {                  // TODO: move to asynchronous processing
            shell.sed('-i', change.search, change.replace, filename);
        });
    };

}());