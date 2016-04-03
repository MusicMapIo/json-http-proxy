var Router = require('router');

export function router (proxyServer, opts = {}) {
	var router = new Router(opts.routerOptions);

	proxyServer.on('registerRoute', function (route) {
		// Register route handler
		route.methods.forEach((method) => {
			router[method](route.path, (req, res, next) => {
				// Check for matching parameters that are not checked for
				// in the path router, like hostname, next it doesnt match
				if (!route.matches(req)) {
					return next();
				}

				// Matched the router
				route.handle(req, res, next);
			});
		});
	});

	proxyServer.on('request', function (req, res) {
		router(req, res, function () {
			proxyServer.emit('error', new Error('Unhandled route: ' + req.url));
		});
	});
}
