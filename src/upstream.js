var url = require('url');

export class Upstream {

	constructor(name, opts = {}) {
		this.name = name;
		this.protocol = opts.protocol || 'http:';
		this.hostname = opts.hostname || 'localhost';
		this.port = opts.port || 80;
		this.path = opts.path || '/';
		this.proxy = opts.proxy;
	}

	handle(req, res) {
		this.proxy.web(req, res, {
			target: url.format(this)
		});
	}
}
