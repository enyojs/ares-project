var fs = require('fs')
	, HermesPhonegap = require('./hermesPhonegap').HermesPhonegap
	, config = {
			certs: {
				key: fs.readFileSync(__dirname + '/certs/key.pem').toString(),
				cert: fs.readFileSync(__dirname + '/certs/cert.pem').toString()
			}
		, port: parseInt(process.argv[2]) || 9050
		}
	, hermesPhonegap = new HermesPhonegap(config)


