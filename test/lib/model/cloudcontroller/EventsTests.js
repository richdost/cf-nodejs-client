/*jslint node: true*/
/*global describe: true, before: true, it: true*/
"use strict";

var Promise = require('bluebird');
var chai = require("chai"),
    expect = require("chai").expect;

var argv = require('optimist').demand('config').argv;
var environment = argv.config;
var nconf = require('nconf');
nconf.argv().env().file({ file: 'config.json' });

var cf_api_url = nconf.get(environment + "_" + 'CF_API_URL'),
    username = nconf.get(environment + "_" + 'username'),
    password = nconf.get(environment + "_" + 'password');

var CloudFoundry = require("../../../../lib/model/cloudcontroller/CloudFoundry");
var CloudFoundryUsersUAA = require("../../../../lib/model/uaa/UsersUAA");
var CloudFoundryEvents = require("../../../../lib/model/cloudcontroller/Events");
CloudFoundry = new CloudFoundry();
CloudFoundryUsersUAA = new CloudFoundryUsersUAA();
CloudFoundryEvents = new CloudFoundryEvents();

describe("Cloud foundry Events", function () {

    var authorization_endpoint = null;
    var token_endpoint = null;
    var token_type = null;
    var access_token = null;

    before(function () {
        this.timeout(15000);

        CloudFoundry.setEndPoint(cf_api_url);
        CloudFoundryEvents.setEndPoint(cf_api_url);

        return CloudFoundry.getInfo().then(function (result) {
            authorization_endpoint = result.authorization_endpoint;
            token_endpoint = result.token_endpoint;
            CloudFoundryUsersUAA.setEndPoint(authorization_endpoint);
            return CloudFoundryUsersUAA.login(username, password);
        }).then(function (result) {
            token_type = result.token_type;
            access_token = result.access_token;
        });
    });

    //TODO: This component has some performance problems in Pivotal systems.
    it("The platform returns the Events", function () {
        this.timeout(100000);

        return CloudFoundryEvents.getEvents(token_type, access_token).then(function (result) {
            expect(result.total_results).is.a("number");
        });
    });

    it("The platform returns the Events With Optional Query String Parameters", function () {
        this.timeout(100000);
        /*
        var filter = {
            'q': ['timestamp>=' + "2015-10-16T00:00:00Z", 'actee:' + "7eddcf88-aba8-45e2-a682-0b6a00c8b93c"],
            'results-per-page': 20
        };
        */
        var filter = {
            'q': ['timestamp>=' + "2015-10-16T00:00:00Z"],
            'results-per-page': 20
        };       
        return CloudFoundryEvents.getEvents(token_type, access_token, filter).then(function (result) {
            expect(result.total_results).is.a("number");
            expect(result.resources.length).to.equal(20);
        });
    });
});