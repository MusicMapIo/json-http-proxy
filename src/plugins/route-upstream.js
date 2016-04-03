var url = require('url');

module.exports = function routeUpstream (proxyServer) {
	proxyServer.on('registerRoute', function (route) {
		// If upstream is a string it is a named upstream
		if (typeof route.upstream === 'string') {
			route.upstream = proxyServer.getUpstream(route.upstream);
			return;
		}

		// If upstream is an object it is an upstream definition
		if (typeof route.upstream === 'object') {
			var name = url.format({
				hostname: route.hostname || 'localhost',
				port: typeof route.port !== 'undefined' ? route.port : 80,
				path: route.path || '/'
			});

			route.upstream = proxyServer.registerUpstream(name, route.upstream);
		}
	});
};
