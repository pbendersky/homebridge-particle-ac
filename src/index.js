var request = require("request");
var Service, Characteristic;
var Particle = require("particle-api-js");
var _ = require('lodash');
const HeaterCoolerState = require("./HeaterCoolerState.js");

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
  
  this.heaterCoolerState = new HeaterCoolerState()
  
  this.particle = new Particle();

  this.log("particleToken: %s", this.particleToken);
  this.log("particleDeviceID: %s", this.particleDeviceID);
  
  this.service = new Service.HeaterCooler(this.name);
  
  this.throttledSend = _.debounce(this.sendIR, 2000, { 'trailing': true });

  this.service
    .getCharacteristic(Characteristic.Active)
    .on('get', this.getActive.bind(this))
    .on('set', this.setActive.bind(this));
  this.service
    .getCharacteristic(Characteristic.CurrentHeaterCoolerState)
    .on('get', this.getCurrentHeaterCoolerState.bind(this));
  this.service
    .getCharacteristic(Characteristic.TargetHeaterCoolerState)
    .on('get', this.getTargetHeaterCoolerState.bind(this))
    .on('set', this.setTargetHeaterCoolerState.bind(this));
  this.service
    .getCharacteristic(Characteristic.CurrentTemperature)
    .on('get', this.getCurrentTemperature.bind(this));
  this.service
    .getCharacteristic(Characteristic.SwingMode)
    .on('get', this.getSwingMode.bind(this))
    .on('set', this.setSwingMode.bind(this));
  this.service
    .getCharacteristic(Characteristic.CoolingThresholdTemperature)
    .on('get', this.getCoolingThresholdTemperature.bind(this))
    .on('set', this.setCoolingThresholdTemperature.bind(this));
  this.service
    .getCharacteristic(Characteristic.HeatingThresholdTemperature)
    .on('get', this.getHeatingThresholdTemperature.bind(this))
    .on('set', this.setHeatingThresholdTemperature.bind(this));
  this.service
    .getCharacteristic(Characteristic.RotationSpeed)
    .setProps({
      minValue: 0,
      maxValue: 100,
      minStep: 25
    })
    .on('get', this.getRotationSpeed.bind(this))
    .on('set', this.setRotationSpeed.bind(this));
}

ParticleAC.prototype.getActive = function(callback) {
	this.log("getCurrentActive");
  callback(null, this.heaterCoolerState.active);
}

ParticleAC.prototype.setActive = function(newValue, callback) {
	this.log("setActive");
  this.heaterCoolerState.active = newValue;
  callback();
  this.throttledSend();
}

ParticleAC.prototype.getCurrentHeaterCoolerState = function(callback) {
	this.log("getCurrentHeaterCoolerState");
  callback(null, Characteristic.CurrentHeaterCoolerState.INACTIVE);
}

ParticleAC.prototype.getTargetHeaterCoolerState = function(callback) {
	this.log("getTargetHeaterCoolerState");
  callback(null, Characteristic.TargetHeaterCoolerState.COOL);
}

ParticleAC.prototype.setTargetHeaterCoolerState = function(newValue, callback) {
  this.log("setTargetHeaterCoolerState");
  this.heaterCoolerState.mode = newValue;
  callback();
  if (newValue == Characteristic.TargetHeaterCoolerState.HEAT) {
    this.service.setCharacteristic(Characteristic.CurrentHeaterCoolerState, Characteristic.CurrentHeaterCoolerState.HEATING);
  } else if (newValue == Characteristic.TargetHeaterCoolerState.COOL) {
    this.service.setCharacteristic(Characteristic.CurrentHeaterCoolerState, Characteristic.CurrentHeaterCoolerState.COOLING);
  }
  this.throttledSend();
}

ParticleAC.prototype.getCurrentTemperature = function(callback) {
	this.log("Getting current temperature");
  this.particle.getVariable({ deviceId: this.particleDeviceID, name: 'currentTemp', auth: this.particleToken})
    .then((data) => {
      this.heaterCoolerState.currentTemperature = data.body.result;
      callback(null, data.body.result);
    }, (err) => {
      this.log("error: %s", err);
      callback(err);
    });
}

ParticleAC.prototype.getSwingMode = function(callback) {
	this.log("getSwingMode");
  callback(null, this.heaterCoolerState.swingMode);
}

ParticleAC.prototype.setSwingMode = function(newValue, callback) {
	this.log("setSwingMode");
  callback();
  this.heaterCoolerState.swingMode = newValue;
  this.throttledSend();
}

ParticleAC.prototype.getCoolingThresholdTemperature = function(callback) {
	this.log("getCoolingThresholdTemperature");
  callback(null, this.heaterCoolerState.targetTemperature);
}

ParticleAC.prototype.setCoolingThresholdTemperature = function(newValue, callback) {
	this.log("setCoolingThresholdTemperature");
  this.heaterCoolerState.targetTemperature = newValue;
  this.service.updateCharacteristic(Characteristic.HeatingThresholdTemperature, newValue);
  callback();
  this.throttledSend();
}

ParticleAC.prototype.getHeatingThresholdTemperature = function(callback) {
	this.log("getHeatingThresholdTemperature");
  callback(null, this.heaterCoolerState.targetTemperature);
}

ParticleAC.prototype.setHeatingThresholdTemperature = function(newValue, callback) {
	this.log("setHeatingThresholdTemperature");
  this.heaterCoolerState.targetTemperature = newValue;
  this.service.updateCharacteristic(Characteristic.CoolingThresholdTemperature, newValue);
  callback();
  this.throttledSend();
}

ParticleAC.prototype.getRotationSpeed = function(callback) {
	this.log("getRotationSpeed");
  callback(null, this.heaterCoolerState.fanSpeed);
}

ParticleAC.prototype.setRotationSpeed = function(newValue, callback) {
  this.log("setRotationSpeed");
  callback();
  this.heaterCoolerState.fanSpeed = newValue;
  this.throttledSend();
}

ParticleAC.prototype.sendIR = function() {
  this.log("sendIR");
  this.log(this.heaterCoolerState.getOperationString());
  this.particle.callFunction({
    deviceId: this.particleDeviceID,
    name: 'updateState',
    argument: this.heaterCoolerState.getOperationString(),
    auth: this.particleToken
  })
    .then((data) => {
      this.log("IR Sent!")
    }, (err) => {
      this.log("error: %s", err);
    });
}

ParticleAC.prototype.getServices = function() {
  return [this.service];
}
