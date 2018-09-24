#!/bin/env node
//  OpenShift sample Node application
var express = require('express');
//var fs      = require('fs');
//var https = require('https');
var http = require('http');
//var querystring = require('querystring');
//var request = require('request');
const NissanConnect = require('@beejjacobs/nissan-connect').NissanConnect;

/**
 *  Define the sample application.
 */
var SampleApp = function() {

    //  Scope.
    var self = this;


    /*  ==================================================================  */
    /*  Helper functions.                                                 */
    /*  ==================================================================  */

    /**
     *  Set up server IP address and port # using env variables/defaults.
     */
    self.setupVariables = function() {
        //  Set the environment variables we need.
        //self.ipaddress = process.env.OPENSHIFT_NODEJS_IP;
        self.port      =  process.env.PORT || 8080;
    };

    /**
     *  terminator === the termination handler
     *  Terminate server on receipt of the specified signal.
     *  @param {string} sig  Signal to terminate on.
     */
    self.terminator = function(sig){
        if (typeof sig === "string") {
           console.log('%s: Received %s - terminating sample app ...',
                       Date(Date.now()), sig);
           process.exit(1);
        }
        console.log('%s: Node server stopped.', Date(Date.now()) );
    };


    /**
     *  Setup termination handlers (for exit and a list of signals).
     */
    self.setupTerminationHandlers = function(){
        //  Process on exit and signals.
        process.on('exit', function() { self.terminator(); });

        // Removed 'SIGPIPE' from the list - bugz 852598.
        ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
         'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
        ].forEach(function(element, index, array) {
            process.on(element, function() { self.terminator(element); });
        });
    };


    /*  ================================================================  */
    /*  App server functions (main app logic here).                       */
    /*  ================================================================  */

    /**
     *  Create the routing table entries + handlers for the application.
     */
    self.createRoutes = function() {
        self.routesGet = { };
        self.routesPost = { };

        self.routesGet['/battery'] = async function(req, res) {
            console.log("GET percentage at " + new Date() + " from " + req.headers['x-forwarded-for']);
            try {
                res.setHeader('Content-Type', 'application/json');
                let perc = await self.getPercentage(req.query.username, req.query.password);
                res.status(200).send({"Percentage": perc});
            } catch(e) {
                console.log(e);
                res.status(500).send({"status": "KO", "error": e});
            }
        };

        self.routesPost['/battery'] = async function(req, res) {
            console.log("POST percentage at " + new Date() + " from " + req.headers['x-forwarded-for']);
            try {
                res.setHeader('Content-Type', 'application/json');
                let perc = await self.getPercentage(req.body.username, req.body.password);
                res.status(200).send({"Percentage": perc});
            } catch(e) {
                console.log(e);
                res.status(500).send({"status": "KO", "error": e});
            }
        };

        self.routesGet['/fanOn'] = async function(req, res) {
            console.log("GET FanOn at " + new Date() + " from " + req.headers['x-forwarded-for']);
            try {
                res.setHeader('Content-Type', 'application/json');
                await self.setFan("on", req.query.username, req.query.password);
                res.status(200).send({"status": "OK"});
            } catch(e) {
                console.log(e);
                res.status(500).send({"status": "KO", "error": e});
            }
        };

        self.routesPost['/fanOn'] = async function(req, res) {
            console.log("POST FanOn at " + new Date() + " from " + req.headers['x-forwarded-for']);
            try {
                res.setHeader('Content-Type', 'application/json');
                await self.setFan("on", req.body.username, req.body.password);
                res.status(200).send({"status": "OK"});
            } catch(e) {
                console.log(e);
                res.status(500).send({"status": "KO", "error": e});
            }
        };

        self.routesGet['/fanOff'] = async function(req, res) {
            console.log("GET FanOff at " + new Date() + " from " + req.headers['x-forwarded-for']);
            try {
                res.setHeader('Content-Type', 'application/json');
                await self.setFan("off", req.query.username, req.query.password);
                res.status(200).send({"status": "OK"});
            } catch(e) {
                console.log(e);
                res.status(500).send({"status": "KO", "error": e});
            }
        };

        self.routesPost['/fanOff'] = async function(req, res) {
            console.log("POST FanOff at " + new Date() + " from " + req.headers['x-forwarded-for']);
            try {
                res.setHeader('Content-Type', 'application/json');
                await self.setFan("off", req.body.username, req.body.password);
                res.status(200).send({"status": "OK"});
            } catch(e) {
                console.log(e);
                res.status(500).send({"status": "KO", "error": e});
            }
        };

        self.routesGet['/startCharge'] = async function(req, res) {
            console.log("GET startCharge at " + new Date() + " from " + req.headers['x-forwarded-for']);
            try {
                res.setHeader('Content-Type', 'application/json');
                await self.startCharge(req.query.username, req.query.password);
                res.status(200).send({"status": "OK"});
            } catch(e) {
                console.log(e);
                res.status(500).send({"status": "KO", "error": e});
            }
        };

        self.routesPost['/startCharge'] = async function(req, res) {
            console.log("POST startCharge at " + new Date() + " from " + req.headers['x-forwarded-for']);
            try {
                res.setHeader('Content-Type', 'application/json');
                await self.startCharge(req.body.username, req.body.password);
                res.status(200).send({"status": "OK"});
            } catch(e) {
                console.log(e);
                res.status(500).send({"status": "KO", "error": e});
            }
        };

        self.routesGet['/aveqRSS'] = function(req, res) {
            console.log("RSS");
            try {
                res.setHeader('Content-Type', 'text/xml');
                var options = {
                    host: 'www.aveq.ca',
                    port: 80,
                    path: '/1/feed',
                };
                //request(options, function(error, response, body) {

                //});
                var proxy = http.request(options, function(response) {
                    response.pipe(res);
                })
                req.pipe(proxy);
            } catch(e) {
                console.log(e);
                res.status(500).send({"status": "KO", "error": e});
            }
        };

    };

    self.setFan = async function(command, username, password) {
console.log("setFan: " + command);
        let nc = new NissanConnect(username, password, NissanConnect.Region.Canada);
        let api = nc.api.ac;
        const res = (command == 'on')? (await nc.request(api, api.requestOn)) : (await nc.request(api, api.requestOff));
      
        //let res = (command == 'on')? (await nc.api.ac.requestOnResult(nc.leaf, nc.customerInfo, key)) : (nc.api.ac.requestOffResult(nc.leaf, nc.customerInfo, key));
//console.dir(res);
//console.log(typeof res);
//console.log(res instanceof Promise);
        if (res == null) {
            throw new Error(JSON.stringify(res.info));
        }
    };

    self.startCharge = async function(username, password) {
//console.log("startCharge");
        let nc = new NissanConnect(username, password, NissanConnect.Region.Canada);
        let res = await nc.startCharging();
        if (((res instanceof Promise) == false) && (res != null) && (res.info.status != 200)) {
            throw new Error(JSON.stringify(res));
        }
    };

    self.getPercentage = async function(username, password) {
//console.log("start Percentage");
        let nc = new NissanConnect(username, password, NissanConnect.Region.Canada);
        let res = await nc.getBatteryStatus();
//console.dir(res);
        if (((res instanceof Promise) == false) && (res != null) && (res.info.status != 200)) {
            throw new Error(JSON.stringify(res));
        }
        return Math.floor(res.batteryStatus.chargeState / res.batteryStatus.capacity * 100);
    };
        
   /**
     *  Initialize the server (express) and create the routes and register
     *  the handlers.
     */
    self.initializeServer = function() {
        self.createRoutes();
        self.app = express();
        var bodyParser = require("body-parser");
        self.app.use(bodyParser.urlencoded({ extended: false }));
        self.app.use(bodyParser.json());
        //  Add handlers for the app (from the routes).
        for (var r in self.routesGet) {
            self.app.get(r, self.routesGet[r]);
        }
        for (var r in self.routesPost) {
            self.app.post(r, self.routesPost[r]);
        }
    };


    /**
     *  Initializes the sample application.
     */
    self.initialize = function() {
        self.setupVariables();
        self.setupTerminationHandlers();

        // Create the express server and routes.
        self.initializeServer();
    };


    /**
     *  Start the server (starts up the sample application).
     */
    self.start = function() {
        //  Start the app on the specific interface (and port).
        //var privateKey = fs.readFileSync(__dirname + '/ssl/key.pem').toString();
        //var certificate = fs.readFileSync(__dirname + '/ssl/cert.pem').toString();

        // openssl req -newkey rsa:2048 -new -nodes -keyout key.pem -out csr.pem
        // 
        
        //var options = {
        //  key: privateKey,
        //  cert: certificate
        //};

        //https.createServer(options, self.app).listen(self.port, function() {
        self.app.listen(self.port, function() {
            console.log('%s: Node server started at port %d ...',
                        Date(Date.now() ), self.port);
        });
    };

};   /*  Sample Application.  */



/**
 *  main():  Main code.
 */
var carwings = new SampleApp();
carwings.initialize();
carwings.start();

