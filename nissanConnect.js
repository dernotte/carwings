const Logger = require('./logger');
const Api = require('./nissanConnectApi');

class NissanConnect {
    /**
     *
     * @param {string} username
     * @param {string} password
     * @param {string} [region=NE]
     */
    constructor(username, password, region = NissanConnect.Region.Canada) {
      /**
       * @type {NissanConnectApi}
       */
      this.api = new Api(region);
      this.username = username;
      this.password = password;
      this.region = region;
      this.loggedIn = false;
      this.loggingIn = false;
      this.logger = new Logger(this.constructor.name);
    }

    /**
     * Login and save the necessary information for future requests
     * @returns {Promise.<*>}
     */
    async login() {
      this.loggingIn = true;
      let res = await this.api.login(this.username, this.password);
      this.logger.log('logged in');
      this.loggedIn = true;
      this.loggingIn = false;
    }

  /**
   * @returns {Promise.<AcOn>}
   */
  async acOn() {
    await this.checkLogin();
    let api = this.api.ac;
    const key = await this.request(api, api.requestOn);
    let updateInfo = await this.api.ac.requestOnResult(this.leaf, this.customerInfo, key);
    while (updateInfo === null) {
      this.logger.log('retrying ac requestResult');
      [updateInfo] = await Promise.all([
        this.api.ac.requestOnResult(this.leaf, this.customerInfo, key),
        NissanConnect.timeout(5000) //wait 5 seconds before continuing
      ]);
    }
    return updateInfo;
  }

  /**
   * @returns {Promise.<AcOff>}
   */
  async acOff() {
    await this.checkLogin();
    let api = this.api.ac;
    const key = await this.request(api, api.requestOff);
    let updateInfo = await this.api.ac.requestOffResult(this.leaf, this.customerInfo, key);
    while (updateInfo === null) {
      this.logger.log('retrying ac requestResult');
      [updateInfo] = await Promise.all([
        this.api.ac.requestOffResult(this.leaf, this.customerInfo, key),
        NissanConnect.timeout(5000) //wait 5 seconds before continuing
      ]);
    }
    return updateInfo;
  }    
    /**
     * @return {Promise}
     */
    async startCharging() {
      let api = this.api.battery;
      return this.request(api, api.startCharging);
    }
  
  /**
   * @param {object} api
   * @param {Function} func
   * @param {[]|*} [args]
   * @return {Promise<*>}
   */
  async request(api, func, args = []) {
    await this.checkLogin();
    let result;
    if (!Array.isArray(args)) {
      args = [args];
    }
    try {
      result = await func.call(api, ...args);
    } catch (e) {
      if (e === 401) {
        await this.reLogin();
        return await func.call(api, ...args);
      }
      throw e;
    }
    return result;
  }

  /**
   * Check the login state and call login if necessary
   * @return {Promise}
   */
  async checkLogin() {
    this.logger.log('checkLogin loggedIn = ' + this.loggedIn);
    if (this.loggedIn) {
      return;
    }
    if (this.loggingIn) {
      await NissanConnect.timeout(2000);
      return this.checkLogin();
    }
    await this.login();
  }

  async reLogin() {
    this.logger.log('not authorised, retrying');
    this.loggedIn = false;
    return this.checkLogin();
  }

  static timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

}

/**
 *
 * @type {{Australia: string, Canada: string, Europe: string, Japan: string, USA: string}}
 */
NissanConnect.Region = {
  Australia: 'NMA',
  Canada: 'CA',
  Europe: 'NE',
  Japan: 'NML',
  USA: 'NNA'
};

NissanConnect.endpoints = {
  baseURL: "https://icm.infinitiusa.com/NissanLeafProd/rest",
  activateHVAC: "/hvac/vehicles/{vin}/activateHVAC",
  deactivateHVAC: "/hvac/vehicles/:vin/deactivateHVAC",
  remoteChargingRequest: "/battery/vehicles/:vin/remoteChargingRequest",
  login: "/auth/authenticationForAAS"
}

module.exports = NissanConnect;