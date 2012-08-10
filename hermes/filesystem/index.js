var fs = require('fs')
	, HermesFilesystem = require('./hermesFilesystem').HermesFilesystem
	, config = {
			certs: {
				key: fs.readFileSync(__dirname + '/certs/key.pem').toString(),
				cert: fs.readFileSync(__dirname + '/certs/cert.pem').toString()
			}
		, port: parseInt(process.argv[2], 10) || 0
		, debug: true
		}
	, hermesFilesystem = new HermesFilesystem(config);
