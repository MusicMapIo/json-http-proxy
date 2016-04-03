var url = require('url');

export class Upstream {
	constructor (name, opts = {}) {
		if (!opts.proxy) {
			throw new TypeError('proxy is required');
		}

		this.name = name;
		this.protocol = opts.protocol || 'http:';
		this.hostname = opts.hostname || 'localhost';
		this.port = typeof opts.port !== 'undefined' ? opts.port : 80;
		this.path = opts.path || '/';
		this.proxy = opts.proxy;
	}

	handle (req, res) {
		this.proxy.web(req, res, {
			target: url.format(this)
		});
	}
}
