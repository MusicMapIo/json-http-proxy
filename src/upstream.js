var url = require('url');

const _proxy = Symbol('proxy');

export class Upstream {
	constructor (name, opts = {}) {
		if (!opts.proxy) {
			throw new TypeError('proxy is required');
		}

		this.name = name;
		this.protocol = opts.protocol || 'http:';
		this.hostname = opts.hostname || 'localhost';
		this.port = typeof opts.port !== 'undefined' ? opts.port : opts.protocol === 'http:' ? 80 : 443;
		this.path = opts.path || '/';
		this[_proxy] = opts.proxy;
	}

	handle (req, res) {
		this[_proxy].web(req, res, {
			target: url.format({
				protocol: this.protocol,
				hostname: this.hostname,
				port: this.port,
				path: this.path
			})
		});
	}
}
