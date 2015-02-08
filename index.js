var express = require('express');
var supertest = require('supertest');

module.exports = Endpoint;
// TODO: export express' properties as well.

function Endpoint() {
	var endpoint = express();

	endpoint._workers = [];

	// Create a worker
	endpoint.worker = function(filename, options) {
		endpoint._workers.push = {
			filename: filename,
			options: options
		}
	};

	endpoint.purge = function(path) {
		// meh.
		// for purging paths? ie. endpoint.purge('/some/data');
		// could only need this if we have workers which stay up to date on the data
	};

	endpoint.tester = function(path) {
		return supertest(endpoint)
			.get(path)
			.expect('Content-Type', /json/);
	}

	return endpoint;
}
