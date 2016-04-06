/* eslint-disable no-new */
var http = require('http');
var ProxyServer = require('../../');
var cookie = require('cookie');

var s = http.createServer(function (req, res) {
	console.log('Upstream request recieved: ' + req.url, req.headers && req.headers.cookie);
	if (req.url === '/foo') {
		res.setHeader('set-cookie', cookie.serialize('bar', 'foo', {
			path: '/foo',
			maxAge: 60
		}));
	} else {
		res.setHeader('set-cookie', cookie.serialize('foobar', 'bazfoz', {
			expires: new Date(Date.now() + (1000 * 60 * 60 * 24)) // 1 day
		}));
	}
	res.statusCode = 200;
	res.end('basic');
});

s.listen(8080, function () {
	new ProxyServer({
		port: 8081,
		routes: [{
			path: '/*',
			upstream: {
				port: 8080
			}
		}],
		plugins: {
			cookie: {
				request: {
					foo: {
						name: 'bar',
						replace: true
					},
					baz: {
						name: 'barz'
					},
					foz: {
						value: 'faz'
					}
				},
				response: {
					bar: {
						name: 'barz',
						replace: true,
						changeDomain: true,
						maxAge: 60 // 1 min
					},
					foobar: {
						value: 'zofzab',
						setIfNotExists: true
					}
				}
			}
		}
	}, function (err) {
		if (err) {
			console.error(err);
			process.exit();
		}
		console.log('Proxy server running on localhost:8081, upstream running on localhost:8080');
	});
});
