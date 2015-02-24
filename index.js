var express = require('express');
var supertest = require('supertest');

module.exports = Endpoint;
// TODO: export express' properties as well.

function Endpoint() {
	var endpoint = express();

	endpoint.root = '/';
	endpoint.parent = endpoint;

	endpoint._workers = [];

	// Create a worker
	endpoint.worker = function(filename, options) {
		endpoint._workers.push = {
			filename: filename,
			options: options
		};
	};

	endpoint.tester = function(path) {
		return supertest(endpoint.parent)
			.get(endpoint.mountpath + path)
			.expect('Content-Type', /json/);
	};

	endpoint.mounted = false;
	endpoint.on('mount', function(parent) {
		endpoint.mounted = true;
		endpoint.parent = parent;
	});

	return endpoint;
}
