var express = require('express');
var supertest = require('supertest');
var Promise = require('bluebird');
var statuses = require('statuses');

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
		_get(path, function(req, res, next) {

			//@TODO We want to have a limited version of req passed in as the obj
			var obj = req || {};


			/*
				There is a bit of a problem here. We get a function back that returns
				the promise. We have to execute the endpoint once to find out if it returns
				a promise or if it throws. This is very bad and needs to be solved in a better way
			 */
			var cbResults;
			var callback;

			//Hack to catch the throw as well
			try{
				cbResults = cb(obj,function(){});
			}catch(e){
				//It did a throw so it wants a promise wrapper
				cbResults = undefined;
			}

			//Find out if it is a deep promise or not
			if(typeof cbResults === 'undefined' || typeof cbResults.then !== 'function'){
				callback = Promise.promisify(cb)(obj);
			}else{
				callback = cb(obj);
			}

			callback
				.then(function(data) {
					console.log('IN here');
					res.json(data);
				})
				.catch(function(err) {
					console.error('Endpoint error:',err);

					var code = parseInt(err.message);

					err = !isNaN(parseFloat(code)) && isFinite(code) ? code : 500;
					res.status(err).json({
						error: statuses[err]
					});
				});
		});
	};

	return endpoint;
}
