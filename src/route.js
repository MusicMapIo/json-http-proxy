var methods = require('methods');

export class Route {
	constructor (opts = {}) {
		this.path = opts.path || '/';
		this.hostname = opts.hostname || null;
		this.upstream = opts.upstream;

		if (opts.method) {
			this.methods = [opts.method.toLowerCase()];
		} else {
			this.methods = (opts.methods || methods).map(function (m) {
				return m.toLowerCase();
			});
		}
	}

	matches (req) {
		// Check for hostname match
		if (req.headers && this.hostname && req.headers.hostname !== this.hostname) {
			return false;
		}
		// Do other checks??

		// All matched, move along
		return true;
	}

	handle (req, res, next) {
		this.upstream && this.upstream.handle(req, res, next);
	}
}
