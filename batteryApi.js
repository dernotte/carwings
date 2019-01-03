//const AcOn = require('./ac-on');
//const AcOff = require('./ac-off');
const Config = require('./config');

/**
 *
 */
class BatteryApi  {
  /**
   *
   * @param {NissanConnectApi} api
   */
  constructor(api) {
    this.api = api;
  }

  /**
   * @param {Leaf} leaf
   * @param {CustomerInfo} customerInfo
   * @returns {Promise.<string>}
   */
  async requestOn() {
    this.api.log('ac request');
    let res = await this.api.request(Config.endPoints.acRemote, {
    });
    return res;
  }
}

module.exports = BatteryApi;


