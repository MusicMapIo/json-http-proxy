/* eslint-disable no-new */
var http = require('http');
var ProxyServer = require('../../');

var foo = http.createServer(function (req, res) {
	console.log('Upstream request recieved on foo: ' + req.url);
	res.statusCode = 200;
	res.end('foo');
});
var bar = http.createServer(function (req, res) {
	console.log('Upstream request recieved on bar: ' + req.url);
	res.statusCode = 200;
	res.end('bar');
});

foo.listen(8081, function () {
	bar.listen(8082, function () {
		new ProxyServer({
			port: 8080,
			routes: [{
				hostname: 'foo.com',
				upstream: 'foo'
			}, {
				hostname: 'bar.com',
				upstream: 'bar'
			}],
			upstreams: {
				foo: {
					port: 8081
				},
				bar: {
					port: 8082
				}
			}
		}, function (err) {
			if (err) {
				console.error(err);
				process.exit();
			}
			console.log('Proxy server running on localhost:8080, upstreams running on localhost:8081/8082');
		});
	});
});
