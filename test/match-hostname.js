/* global describe, it */
var assert = require('assert');
var matchHostname = require('../lib/match-hostname');
var Route = require('../lib/route').Route;
var Request = require('http').IncomingMessage;

describe('json-http-proxy:match-hostname', function () {
	it('match default values', function () {
		var req = new Request();
		var route = new Route();

		// Match http requests
		assert(matchHostname(req, route));

		// Match https requests
		req.connection = {
			encrypted: true
		};
		assert(matchHostname(req, route));
	});

	it('match on a plain hostname', function () {
		var req = new Request();
		req.headers.host = 'example.com';
		var route = new Route({
			hostname: 'example.com'
		});
		assert(matchHostname(req, route));
		req.headers.host = 'foo.example.com';
		assert(!matchHostname(req, route));
	});

	it('match on a hostname with a port', function () {
		var req = new Request();
		req.headers.host = 'example.com:1234';
		var route = new Route({
			hostname: 'example.com',
			port: 1234
		});
		assert(matchHostname(req, route));
	});
});
