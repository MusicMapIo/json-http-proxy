/* eslint-disable no-new */
var http = require('http');

var s = http.createServer(function (req, res) {
	console.log('Upstream request recieved: ' + req.url);
	res.statusCode = 200;
	res.end('basic');
});

s.listen(8080, function (err) {
	if (err) {
		console.error(err);
		process.exit();
	}
	console.log('Upstream running on localhost:8080');
});
