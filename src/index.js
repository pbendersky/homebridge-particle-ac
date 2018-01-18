var request = require("request");
var Service, Characteristic;
var Particle = require("particle-api-js");
const Thermostat = require("./Thermostat.js");

module.exports = (homebridge) => {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  
  homebridge.registerAccessory("homebridge-particle-ac", "ParticleAC", ParticleAC);
}

function ParticleAC(log, config) {
  this.log = log;
  this.name = config["name"];
  this.baseURL = config["baseURL"]
  this.particleToken = config["particleToken"];
  this.particleDeviceID = config["particleDeviceID"];

  this.particle = new Particle();

  this.log("particleToken: %s", this.particleToken);
  this.log("particleDeviceID: %s", this.particleDeviceID);
  
  this.service = new Service.Thermostat(this.name);
  
  this.service
    .getCharacteristic(Characteristic.CurrentTemperature)
    .on('get', this.getCurrentTemperature.bind(this));
  this.service
    .getCharacteristic(Characteristic.CurrentRelativeHumidity)
    .on('get', this.getCurrentHumidity.bind(this));
  this.service
    .getCharacteristic(Characteristic.TemperatureDisplayUnits)
    .on('get', this.getTemperatureDisplayUnits.bind(this))
    .on('set', this.setTemperatureDisplayUnits.bind(this));
  this.service
    .getCharacteristic(Characteristic.TargetTemperature)
    .on('get', this.getTargetTemperature.bind(this))
    .on('set', this.setTargetTemperature.bind(this));
}

ParticleAC.prototype.getCurrentTemperature = function(callback) {
	this.log("Getting current temperature");

  this.particle.getVariable({ deviceId: this.particleDeviceID, name: 'currentTemp', auth: this.particleToken})
    .then((data) => {
      this.log(data.body.result);
      callback(null, data.body.result);
    }, (err) => {
      this.log("error: %s", err);
      callback(err);
    });
}

ParticleAC.prototype.getCurrentHumidity = function(callback) {
  this.log("Getting current humidity");

  this.particle.getVariable({ deviceId: this.particleDeviceID, name: 'currentHumid', auth: this.particleToken})
    .then((data) => {
      this.log(data.body.result);
      callback(null, data.body.result);
    }, (err) => {
      this.log("error: %s", err);
      callback(err);
    });
}

ParticleAC.prototype.getTemperatureDisplayUnits = function(callback) {
  this.log("Getting Temperature Display Units");
  callback(null, Characteristic.TemperatureDisplayUnits.CELSIUS);
}

ParticleAC.prototype.setTemperatureDisplayUnits = function(newValue, callback) {
  this.log("Setting Temperature Display Units");
  this.log(newValue);
  callback();
}

ParticleAC.prototype.getTargetTemperature = function(callback) {
  this.log("Get Target Temperature");
  callback(null, 25);
}

ParticleAC.prototype.setTargetTemperature = function(newValue, callback) {
  this.log("Set Target Temperature to " + newValue);
  callback();
}

ParticleAC.prototype.getServices = function() {
  return [this.service];
}
