var http = require('http');

// Create a http server for a route
module.exports = function startServer (name, done) {
	var s = http.createServer(function (req, res) {
		res.statusCode = 200;
		res.end(name);
	});
	s.listen(null, function () {
		done(s.address().port, function () {
			s.close();
		});
	});
};
