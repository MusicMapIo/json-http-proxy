var url = require('url');

module.exports = function (req, route) {
	// Dont try to match if the route does not specify a hostname or a port
	if (!route.hostname || !route.port) {
		return true;
	}

	// Get protocol from request
	var protocol = (req.headers['X-Forwarded-Proto'] || req.connection && req.connection.encrypted ? 'https' : 'http').split(/\s*,\s*/)[0];

	var host = req.headers.host && url.parse(protocol + '://' + req.headers.host);
	return !!(host && route.hostname === host.hostname && parseInt(route.port, 10) === parseInt(host.port || 80, 10));
};
