var shell = require("shelljs"),
    request = require('request'),
    fs = require("fs"),
    util = require('util'),
    path = require("path"),
    log = require('npmlog'),
    temp = require("temp"),
    async = require("async"),
    mkdirp = require("mkdirp"),
    unzip = require('unzip'),
    copyFile = require('./copyFile');

(function () {

	var generator = {};

	if (typeof module !== 'undefined' && module.exports) {
		module.exports = generator;
	}

	var objectCounter = 0;

	// Hashmap for available templates
	var templates = {};

	function Generator(config, next) {
		// optionnal application libraries
		var libs = config.libs || [];
		config.libs = libs.filter(function(lib) {
			// Each library need to provide a unique "id",
			// a "description" (which does not need to be
			// unique), plus either a "zipfiles"(which is
			// an {Array} of ZIP-files descriptor) and/or
			// a "files" (which is an {Array} of files
			// descriptor)
			return lib.id && lib.description && (lib.zipfiles || lib.files);
		});

		this.config = config;
		log.level = config.level || 'http';
		this.objectId = objectCounter++;
		log.verbose("Generator()", "config:", this.config);

		// TODO: Populate the repositories here (from GenZip#sentConfig() & GenZip#createRepo()).

		next();
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
		 * @param  {Function} next(err, status)     commonjs callback. Will be invoked with an error
		 *               or a json array of generated filenames.
		 * @public
		 */
		registerRemoteTemplates: function(templatesUrl, next) {
			try {
				if (templatesUrl.substr(0, 4) === 'http') {
					var reqOptions = {
						url: templatesUrl,
						proxy: this.config.proxyUrl
					};
					// Issue an http request to get the template definition
					log.http("GET " + templatesUrl);
					request(reqOptions, function (error, response, body) {
						if (!error && response.statusCode == 200) {
							parseInsertTemplates(body, templatesUrl, next);
						} else if (error) {
							next(new Error("Unable to retrieve remote template definition. error=" + error));
						} else if (response && response.statusCode >= 300) {
							next(new Error("Unable to retrieve remote template definition. status code=" + response.statusCode));
						} else {
							// Should not be an error case
						}
					});
				} else {
					fs.readFile(templatesUrl, function(err, data) {
						if (err) {
							next(new Error("Unable to read '" + templatesUrl + "' err: " + err));
							return;
						}
						parseInsertTemplates(data, templatesUrl, next);
					});
				}
			} catch(err) {
				next(err);
			}
		},

		getConfig: function(next) {
			var config = {};
			config.templates = templates.map(function(template) {
				return {
					id: template.id,
					description: template.description,
					libs: template.libs
				};
			});
			config.libs = this.config.libs.map(function(lib) {
				return {
					id: lib.id,
					description: lib.description
				};
			});
			next(null, config);
		},

		generate: function(templateId, libs, substitutions, destination, options, next) {
			log.info("generate()", "using:",  templateId);
			var tmpl = templates && templates[templateId];
			if (!tmpl) {
				next(new Error("Requested templateId (" + templateId + ") does not exist"));
				return;
			}
			tmpl.zipfiles = tmpl.zipfiles || [];
			tmpl.files = tmpl.files || [];

			// extend built-in substitutions using plugin-provided ones
			/*
			log.verbose("generate()", "tmpl.substitutions:", tmpl.substitutions);
			if (tmpl.substitutions) {
				var sm = Object.keys(substitutions).concat(Object.keys(tmpl.substitutions));
				sm.forEach(function(m) {
					var s = substitutions[m],
					    ts = tmpl.substitutions[m];
					if (Array.isArray(ts)) {
						if (Array.isArray(s)) {
							s = s.concat(ts);
						} else {
							s = ts;
						}
					}
					substitutions[m] = s;
				});
			}
			 */
			log.info("generate()", "substitutions:", substitutions);

			// Process all the files
			async.series([
				async.forEachSeries.bind(this, tmpl.zipfiles, processZipFile.bind(this)),
				async.forEachSeries.bind(this, tmpl.files, processFile.bind(this)),
				async.forEachSeries.bind(this, libs, addLib.bind(this)),
				performSubstitution.bind(this, substitutions, options, destination)
			], notifyCaller.bind(this));

			function processZipFile(item, next) {
				log.info("generate#processZipFile()", "Processing " + item.url);
				
				temp.mkdir({prefix: 'com.hp.ares.gen.processZipFile'}, (function(err, zipDir) {
					async.series([
						unzipFile.bind(this, item, options, this.config, zipDir),
						removeExcludedFiles.bind(this, item, options, zipDir),
						prefix.bind(this, item, options, zipDir, destination)
					], next);
				}).bind(this));
			}

			function processFile(item, next) {
				log.info("generate#processFile()", "Processing " + item.url);
				var src = item.url,
				    dst = path.join(destination, item.installAs);
				log.verbose('generate#processFile()', src + ' -> ' + dst);
				async.series([
					mkdirp.bind(this, path.dirname(dst)),
					copyFile.bind(this, src, dst)
				], next);
			}
			
			function addLib(libId, next) {
				log.info("generate#addLib()", "Adding library " + libId);
				var lib = this.config.libs..filter
				async.series([
					async.forEachSeries.bind(this, lib.zipfiles, processZipFile.bind(this)),
					async.forEachSeries.bind(this, lib.files, processFile.bind(this))
				], next);
			}

			function notifyCaller(err) {
				if (err) {
					next(err);
					return;
				}

				// Return the list of extracted files
				var filelist = shell.find(destination);
				next(null, filelist);
			}
		}
	};

	// Private functions
	
	function parseInsertTemplates(data, templatesUrl, next) {
		try {
			var newTemplates = JSON.parse(data);

			var base = (templatesUrl.substr(0, 4) !== 'http') && path.dirname(templatesUrl);

			newTemplates.forEach(function(entry) {
				entry.zipfiles = entry.zipfiles || [];
				entry.zipfiles.forEach(function(zipfile) {
					if (zipfile.url.substr(0, 4) !== 'http') {
						zipfile.url = path.resolve(base, zipfile.url);
					}
				});

				entry.files = entry.files || [];
				entry.files.forEach(function(file) {
					if (file.url.substr(0, 4) !== 'http') {
						file.url = path.resolve(base, file.url);
					}
				});

				templates[entry.id] = entry;
			});
			next(null, {done: true});
		} catch(err) {
			next(new Error("Unable to parse remote template definition. error=" + err.toString()));
		}
	}

	function unzipFile(item, options, config, destination, next) {
		try {
			var source = item.url;

			if ((source.substr(0, 4) !== 'http') && ( ! fs.existsSync(source))) {
				if (item.alternateUrl) {
					source = item.alternateUrl;
				} else {
					next(new Error("File '" + source + "' does not exists"));
					return;
				}
			}

			log.verbose("unzipFile", "Unzipping " + source + " to " + destination);

			// Create an extractor to unzip the template
			var extractor = unzip.Extract({ path: destination });
			extractor.on('error', next);

			// Building the zipStream either from a file or an http request
			var zipStream;
			if (source.substr(0, 4) === 'http') {
				var reqOptions = {
					url: source,
					proxy: config.proxyUrl
				};
				log.http("GET " + source);
				zipStream = request(reqOptions);
			} else {
				zipStream = fs.createReadStream(source);
			}

			// Pipe the zipped content to the extractor to actually perform the unzip
			zipStream.pipe(extractor);

			// Wait for the end of the extraction
			extractor.on('close', next);
		} catch(err) {
			next(err);
		}
	}

	function removeExcludedFiles(item, options, destination, next) {
		if (item.excluded) {            // TODO: move to asynchronous processing
			log.verbose("removeExcludedFiles", "removing excluded files");
			shell.ls('-R', destination).forEach(function(file) {
				item.excluded.forEach(function(pattern) {
					var regexp = new RegExp(pattern);
					if (regexp.test(file)) {
						log.verbose("removeExcludedFiles", "removing: " + file);
						var filename = path.join(destination, file);
						shell.rm('-rf', filename);
					}
				});
			});
		}
		next();
        }

	function prefix(item, options, srcDir, dstDir, next) {
		log.verbose("generate#prefix()", "item:", item);
		if (!item.prefixToRemove && !item.prefixToAdd) {
			log.verbose("generate#prefix()", "skipping prefix changes");
			next();
			return;
		}

		var src = path.join(srcDir, item.prefixToRemove);
		var dst = path.join(dstDir, item.prefixToAdd);
		log.verbose("generate#prefix()", "src:", src, "-> dst:", dst);

		async.waterfall([
			mkdirp.bind(this, dst),
			function(data, next) { fs.readdir(src, next); },
			_mv.bind(this)
		], next);

		function _mv(files, next) {
			log.silly("generate#prefix#_mv()", "files:", files);
			async.forEach(files, function(file, next) {
				log.silly("generate#prefix#_mv()", file + " -> " + dst);
				fs.rename(path.join(src, file), path.join(dst, file), next);
			}, next);
		}
	}

	function performSubstitution(substitutions, options, workDir, next) {
		log.verbose("performSubstitution()", "performing substitutions");

		// Apply the substitutions                  // TODO: move to asynchronous processing
		if (substitutions) {
			shell.ls('-R', workDir).forEach(function(file) {

				substitutions.forEach(function(substit) {
					var regexp = new RegExp(substit.fileRegexp);
					if (regexp.test(file)) {
						log.verbose("performSubstitution()", "substit:", substit, "on file:", file);
						var filename = path.join(workDir, file);
						if (substit.json) {
							log.verbose("performSubstitution()", "Applying JSON substitutions to: " + file);
							applyJsonSubstitutions(filename, substit.json);
						}
						//FIXME: to refactor: sed is UNIX-only, rather use Javascript's replace
						if (substit.sed) {
							log.verbose("performSubstitution()", "Applying SED substitutions to: " + file);
							applySedSubstitutions(filename, substit.sed);
						}
						if (substit.vars) {
							log.verbose("performSubstitution()", "Applying VARS substitutions to: " + file);
							applyVarsSubstitutions(filename, substit.vars);
						}
					}
				});
			});
		}

		next();

		function applyJsonSubstitutions(filename, values) {
			var modified = false;
			var content = fs.readFileSync(filename);
			content = JSON.parse(content);
			var keys = Object.keys(values);
			keys.forEach(function(key) {
				if (content.hasOwnProperty(key)) {
					content[key] = values[key];
					modified = true;
				}
			});
			if (modified) {
				var newContent = JSON.stringify(content, null, 2);
				fs.writeFileSync(filename, newContent);         // TODO: move to asynchronous processing
			}
		};
		
		//FIXME: to refactor: sed is UNIX-only, rather use Javascript's replace
		function applySedSubstitutions(filename, changes) {
			changes.forEach(function(change) {                  // TODO: move to asynchronous processing
				shell.sed('-i', change.search, change.replace, filename);
			});
		};
		
		function applyVarsSubstitutions(filename, changes) {
			// TODO: move to asynchronous processing
			log.verbose("applyVarsSubstitutions()", "substituting variables in '" + filename + "'");
			var content = fs.readFileSync(filename, "utf8" /*force String return*/);
			Object.keys(changes).forEach(function(key) {
				var value = changes[key];
				log.silly("applyVarsSubstitutions()", "key=" + key + " -> value=" + value);
				content = content.replace("\$\{" + key + "\}", value);
			});
			fs.writeFileSync(filename, content, "utf8");
		};
	}

}());
