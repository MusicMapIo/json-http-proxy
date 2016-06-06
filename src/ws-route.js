var methods = require('methods');
var pathToRegexp = require('path-to-regexp');

export class WsRoute {
	constructor (opts = {}) {
		this.path = opts.path || '/';
		this.hostname = opts.hostname || null;
		this.port = opts.port || 80;
		this.upstream = opts.upstream;
		this.regEx = pathToRegexp(this.path);

		if (opts.method) {
			this.methods = [opts.method.toLowerCase()];
		} else {
			this.methods = (opts.methods || methods).map(function (m) {
				return m.toLowerCase();
			});
		}
	}

	handle (req, socket, head, next) {
		this.upstream && this.upstream.handle(req, socket, head, next);
	}
}
