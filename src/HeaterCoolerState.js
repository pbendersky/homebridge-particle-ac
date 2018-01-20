class HeaterCoolerState {
	constructor(active, mode, fanSpeed, currentTemperature, targetTemperature, swingMode) {
    this.active = active;
    this.mode = mode;
    this.fanSpeed = fanSpeed;
    this.currentTemperature = currentTemperature;
    this.targetTemperature = targetTemperature;
    this.swingMode = swingMode;
	}
  
  getOperationString() {
    return [this.active, this.mode, this.fanSpeed, this.targetTemperature, this.swingMode].join("|")
  }
}

module.exports = HeaterCoolerState;
