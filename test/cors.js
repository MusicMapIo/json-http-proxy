/* global describe, it */
var ProxyServer = require('../lib/proxy-server').ProxyServer;
var assert = require('assert');
var http = require('http');
var startServer = require('./_start-server');

describe('json-http-proxy:cors', function () {
	it('should respond to OPTIONS requests', function (done) {
		startServer('test', function (port, close) {
			var ps = new ProxyServer({
				routes: [{
					path: '/foo',
					upstream: 'test'
				}],
				upstreams: {
					test: {
						port: port
					}
				}
			}, function (err) {
				if (err) {
					throw err;
				}

				http.request({
					method: 'OPTIONS',
					hostname: 'localhost',
					port: ps.port,
					path: '/foo',
					headers: {
						'Origin': 'example.com',
						'Access-Control-Request-Method': 'PUT'
					}
				}, function (res) {
					assert.equal(res.statusCode, 200);
					assert.equal(res.headers['access-control-allow-origin'], 'example.com');
					assert.equal(res.headers['access-control-allow-method'], 'PUT');
					close();
					done();
				}).end();
			});
		});
	});

	it('should add access control header to responses', function (done) {
		startServer('test', function (port, close) {
			var ps = new ProxyServer({
				routes: [{
					path: '/foo',
					upstream: 'test'
				}],
				upstreams: {
					test: {
						port: port
					}
				}
			}, function (err) {
				if (err) {
					throw err;
				}

				http.request({
					method: 'GET',
					hostname: 'localhost',
					port: ps.port,
					path: '/foo',
					headers: {
						'Origin': 'example.com'
					}
				}, function (res) {
					assert.equal(res.statusCode, 200);
					assert.equal(res.headers['access-control-allow-origin'], 'example.com');
					assert.equal(res.headers['access-control-allow-method'], 'GET');
					close();
					done();
				}).end();
			});
		});
	});
});
