/* global require, module  */
var prototype, 
	util = require('util'),
	HermesClient = require('./hermesClient').HermesClient, 
	_ = require('../lib/_');

function HermesBuild(inConfig) {
	arguments.callee.super_.call(this, inConfig);
}

util.inherits(HermesBuild, HermesClient);
prototype = Object.getPrototypeOf(HermesBuild.prototype);
HermesBuild.prototype.verbs = Object.create(prototype.verbs || {});

_.extend(true, HermesBuild.prototype, {
	name: "Hermes Build Service", 
	verbs: {}
});

module.exports = {
	HermesBuild: HermesBuild
};
