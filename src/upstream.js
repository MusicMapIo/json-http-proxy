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

	handle () {
		var req = arguments[0];
		// checks the number of arguments to see if this is a standard request or a websocket request
		if (arguments.length === 3) {
			var res = arguments[1];

			this[_proxy].web(req, res, {
				target: url.format({
					protocol: this.protocol,
					hostname: this.hostname,
					port: this.port,
					path: this.path
				})
			});
		} else if (arguments.length === 4) {
			var socket = arguments[1];
			var head = arguments[3];

			this[_proxy].ws(req, socket, head, {
				target: url.format({
					protocol: this.protocol,
					hostname: this.hostname,
					port: this.port,
					path: this.path
				})
			});
		}
	}
}
