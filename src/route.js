export class Route {

	constructor(opts = {}) {
		this.path = opts.path || '/';
		this.hostname = opts.hostname || null;
		this.method = (opts.method || 'get').toLowerCase();
		this.upstream = opts.upstream;
	}

	matches(req) {
		// Check for hostname match
		if (req.headers && this.hostname && req.headers.hostname !== this.hostname) {
			return false;
		}
		// Do other checks??

		// All matched, move along
		return true;
	}

	handle(req, res, next) {
		this.upstream && this.upstream.handle(req, res, next);
	}
}
