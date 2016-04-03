/* eslint-disable no-new */
var http = require('http');
var ProxyServer = require('../../');

var s = http.createServer(function (req, res) {
	console.log('Upstream request recieved: ' + req.url);
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
		}]
	}, function (err) {
		if (err) {
			console.error(err);
			process.exit();
		}
		console.log('Proxy server running on localhost:8081, upstream running on localhost:8080');
	});
});
