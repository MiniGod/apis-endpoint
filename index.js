var express = require('express');
var supertest = require('supertest');
var Promise = require('bluebird');
var statuses = require('statuses');
var _ = require('lodash');
var domain = require('domain');

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

	//Create a mock of the express get method
	var _get = endpoint.get.bind(endpoint);

	//This is our own get interface
	endpoint.get = function(path, cb) {

		//@TOOD add support for middleware
		
		_get(path, function(req, res, next) {

			var ourmagic = {};

			//@TODO explain what is going on here for the endpoint developer
			var obj = _.merge({},req.query, req.params, ourmagic);

			var callback;

			//If the endpoint does something terribly wrong it crashes the whole app.
			//Therefore we need a good strategy to solve it. 
			//For now lets use error domains
			var d = domain.create();

			d.on('error', function(err) {
				console.error(err.stack);

				res.status(500).json({
					error: statuses[500]
				});
			});

			d.run(function() {

				if(cb.length === 3){
					//A function has been promisified
					callback = cb();
				}else if(typeof cb === 'object'){
					//It is just a new Promise, should not be like that though
					//it always returns the same response
					callback = cb;
				}else if(cb.length === 2){
					//It is a standard callback
					callback = Promise.promisify(cb)(obj);
				}else{
					//It is already a promise
					callback = cb(obj);
				}

			  callback
					.then(function(data) {
						res.json(data);
					})
					.catch(function(err) {
						console.error(err.stack);

						var code = parseInt(err.message);

						err = !isNaN(parseFloat(code)) && isFinite(code) ? code : 500;
						res.status(err).json({
							error: statuses[err]
						});
					});
			});
		});
	};

	return endpoint;
}
