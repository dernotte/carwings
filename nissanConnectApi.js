const request = require('request-promise-native');
const Logger = require('./logger');
const AcApi = require('./acApi');
const BatteryApi = require('./batteryApi');
const Config = require('./config');

/**
 * Client library for the Nissan Connect API
 */
class NissanConnectApi {
    /**
     *
     * @param {string} region
     */
    constructor(region) {
      this.region = region;
      this.logger = new Logger(this.constructor.name);
      /**
       * @type {AcApi}
       */
      this.ac = new AcApi(this);
      /**
       * @type {BatteryApi}
       */
      this.battery = new BatteryApi(this);
      this.jsessionId = null;
      this.authToken = null;
      this.vin = null;
    }
  
  
    /**
     *
     * @param {string} username
     * @param {string} password
     * @returns {Promise.<LoginResponse>}
     */
    async login(username, password) {
      this.logger.log('logging in');
      let res = await this.request(Config.endPoints.login, {
        "authenticate": {
            "userid": username,
            "brand-s": "N",
            "language-s": "en_US",
            "password": password,
            "country": this.region
          }
      });
//console.dir(res);
      this.authToken = res.body.authToken;
      this.jsessionId = res.headers['set-cookie'][0].split(';')[0].split('=')[1];
//console.dir(res.body);
      this.vin = res.body.vehicles[0].uvi;
//console.dir(this);

      return res;
    }

    /**
     * Make a request to the Nissan Connect end point
     * @param {string} endPoint
     * @param {object} data
     * @returns {Promise.<*>}
     */
    async request(endPoint, data) {
        const options = {
            uri: Config.baseUrl + endPoint,
            method: 'POST',
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "API-Key": Config.apiKey 
            },
            body: {},
            json: true,
            resolveWithFullResponse: true
        };
        Object.assign(options.body, data);
        if (this.authToken != null) options.headers.Authorization = this.authToken;
        if (this.jsessionId != null) options.headers.Cookie = "JSESSIONID=" + this.jsessionId;
        if (options.uri.indexOf("{vin}") != -1) {
            options.uri = options.uri.replace("{vin}", this.vin);
        }
console.dir(options);
        let res = await request(options);
//console.dir(res);
        let status = res.statusCode;
        if(status !== 200) {
            console.error(res);
            return Promise.reject(status);
        }
        return res;
    }

    log(message) {
        this.logger.log(message);
    }
    
}

  module.exports = NissanConnectApi;