/* global describe, it */
var ProxyServer = require('../lib/proxy-server').ProxyServer;
var assert = require('assert');
var http = require('http');
var parallel = require('run-parallel');
var startServer = require('./_start-server');

describe('json-http-proxy', function () {
	it('exposed interface should look correct', function () {
		var ps = new ProxyServer();
		assert.equal(ps.hostname, null);
		assert.equal(ps.port, null);
		assert.equal(typeof ps.listen, 'function');
		assert.equal(typeof ps.registerUpstream, 'function');
		assert.equal(typeof ps.registerRoute, 'function');
		assert.equal(typeof ps.close, 'function');
	});

	it('should start listening', function (done) {
		var ps = new ProxyServer();
		assert.doesNotThrow(function () {
			ps.listen(function (err) {
				assert(!err);
				assert.notEqual(ps.port, null);
				ps.close();
				done();
			});
		});
	});

	it('should start listening on a port', function (done) {
		var ps = new ProxyServer();
		ps.listen(46570, function (err) {
			assert(!err);
			assert.equal(ps.port, 46570);
			ps.close();
			done();
		});
	});

	it('should add upstreams', function () {
		var ps = new ProxyServer({
			upstreams: {
				test: {
					protocol: 'http:',
					hostname: 'localhost',
					port: 1234
				}
			}
		});
		assert(ps.getUpstream('test').protocol, 'http:');
		assert(ps.getUpstream('test').hostname, 'localhost');
		assert(ps.getUpstream('test').port, 1234);

		var u = ps.registerUpstream('test2', {
			protocol: 'https:',
			hostname: 'example.com'
		});
		assert(u.hostname, 'example.com');
		assert(ps.getUpstream('test2').protocol, 'https:');
		assert(ps.getUpstream('test2').hostname, 'example.com');
		assert(ps.getUpstream('test2').port, 80);
	});

	it('should proxy a route to an upstream', function (done) {
		startServer('test', function (port, close) {
			var ps = new ProxyServer({
				routes: [{
					path: '/test',
					upstream: {
						port: port
					}
				}]
			}, function (err) {
				if (err) {
					throw err;
				}

				http.get('http://localhost:' + ps.port + '/test', function (res) {
					assert.equal(res.statusCode, 200);
					res.on('data', function (d) {
						assert.equal(d, 'test');
						close();
						done();
					});
				});
			});
		});
	});

	it('should proxy a route to an named upstream', function (done) {
		startServer('test', function (port, close) {
			var ps = new ProxyServer({
				routes: [{
					path: '/test',
					upstream: 'test'
				}],
				upstreams: {
					test: {
						path: '/test',
						port: port
					}
				}
			}, function (err) {
				if (err) {
					throw err;
				}

				http.get('http://localhost:' + ps.port + '/test', function (res) {
					assert.equal(res.statusCode, 200);
					res.on('data', function (d) {
						assert.equal(d, 'test');
						close();
						done();
					});
				});
			});
		});
	});

	it('should proxy multiple routes', function (done) {
		startServer('test', function (port, close) {
			var ps = new ProxyServer({
				routes: [{
					path: '/foo',
					upstream: 'test'
				}, {
					path: '/bar',
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

				parallel([function (d1) {
					http.get('http://localhost:' + ps.port + '/foo', function (res) {
						assert.equal(res.statusCode, 200);
						res.on('data', function (d) {
							assert.equal(d.toString(), 'test');
							d1();
						});
					});
				}, function (d2) {
					http.get('http://localhost:' + ps.port + '/bar', function (res) {
						assert.equal(res.statusCode, 200);
						res.on('data', function (d) {
							assert.equal(d.toString(), 'test');
							d2();
						});
					});
				}], function () {
					close();
					done();
				});
			});
		});
	});
});
