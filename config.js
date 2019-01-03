/**
 * @const
 */
const Config = {
    baseUrl: "https://icm.infinitiusa.com/NissanLeafProd/rest",
    apiKey: "f950a00e-73a5-11e7-8cf7-a6006ad3dba0",
    endPoints: {
        acRemote: "/hvac/vehicles/{vin}/activateHVAC",
        acRemoteOff: "/hvac/vehicles/{vin}/deactivateHVAC",
        remoteChargingRequest: "/battery/vehicles/{vin}/remoteChargingRequest",
        login: "/auth/authenticationForAAS"
    }
}

module.exports = Config;