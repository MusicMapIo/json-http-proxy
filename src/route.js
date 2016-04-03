var methods = require('methods');

export class Route {
	constructor (opts = {}) {
		this.path = opts.path || '/';
		this.hostname = opts.hostname || null;
		this.port = opts.port || 80;
		this.upstream = opts.upstream;

		if (opts.method) {
			this.methods = [opts.method.toLowerCase()];
		} else {
			this.methods = (opts.methods || methods).map(function (m) {
				return m.toLowerCase();
			});
		}
	}

	handle (req, res, next) {
		this.upstream && this.upstream.handle(req, res, next);
	}
}
