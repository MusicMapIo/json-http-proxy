var setPrototypeOf = require('setprototypeof');

module.exports = WsRouter;

function WsRouter (options) {
	if (!(this instanceof WsRouter)) {
		return new WsRouter(options);
	}

	function wsRouter (req, socket, head, next) {
		wsRouter.handle(req, socket, head, next);
	}

	// inherit from the correct prototype
	setPrototypeOf(wsRouter, this);

	return wsRouter;
}

WsRouter.prototype = function () {};

WsRouter.prototype.routes = {};

WsRouter.prototype.handle = function handle (method, route, next) {
	if (!Array.isArray(this.routes[method])) {
		this.routes[method] = [];
	}

	this.routes[method].push({
		route: route,
		next: next
	});
};

WsRouter.prototype.getRoutes = function getRoutes (method) {
	return method ? this.routes[method] : this.routes;
};
