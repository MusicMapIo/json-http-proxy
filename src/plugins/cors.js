var matchHostname = require('../match-hostname');

module.exports = function router (proxyServer, opts = {}) {
	// Handle OPTIONS requests
	proxyServer.on('registerRoute', function (route) {
		proxyServer.router.options(route.path, function (req, res, next) {
			// Verify a hostname match
			if (!matchHostname(req, route)) {
				return next();
			}

			res.setHeader('Access-Control-Allow-Origin', req.headers['origin']);
			res.setHeader('Access-Control-Allow-Methods', req.headers['access-control-request-method']);
			res.statusCode = 200;
			res.end();
		});
	});

	// Set the correct cors heades for all responses
	proxyServer.on('proxyRes', function (proxyRes, req) {
		// Set cors headers
		proxyRes.headers['Access-Control-Allow-Origin'] = req.headers['origin'] || req.headers['host'];
		proxyRes.headers['Access-Control-Allow-Methods'] = req.method;
		if (opts.corsHeaders) {
			proxyRes.headers['Access-Control-Allow-Headers'] = opts.corsHeaders.join(', ');
		}
	});
};
