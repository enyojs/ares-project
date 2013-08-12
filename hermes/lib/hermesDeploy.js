/* global require, HermesBuild, module  */
var util = require('util'), 
	HermesClient = require('./hermesClient').HermesClient, 
	_ = require('../lib/_');

function HermesDeploy(inConfig) {
	arguments.callee.super_.call(this, inConfig);
}

util.inherits(HermesDeploy, HermesClient);

_.extend(HermesBuild.prototype, {
	name: "Hermes Deploy Service", 
	verbs: {}
});

module.exports = {
	HermesDeploy: HermesDeploy
};
