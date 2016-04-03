// External deps use normal require
var http = require('http');
var httpProxy = require('http-proxy');
var Router = require('router');
var EventEmitter = require('events');
var url = require('url');

// Internal deps use ES6 module syntax
import {Upstream} from './upstream';
import {Route} from './route';

// Private stuff
const _proxy = Symbol('proxy');
const _upstreams = Symbol('upstreams');
const _routes = Symbol('routes');
const _server = Symbol('server');
const _router = Symbol('router');

export class ProxyServer extends EventEmitter {
	constructor (opts = {}, onListen) {
		super();

		// Save the host and port the server was opened on
		this.hostname = opts.hostname || null;
		this.port = opts.port || null;

		// Create router
		this[_router] = new Router(opts.routerOptions);

		// Create http server
		this[_server] = http.createServer((req, res, next) => {
			this[_router](req, res, () => {
				// do after stuff
				this.emit('error', new Error('Unhandled route'));
			});
		});

		// Create the proxy server
		this[_proxy] = httpProxy.createProxyServer({
			changeOrigin: typeof opts.changeOrigin === 'undefined' ? true : opts.changeOrigin
		});
		this[_proxy].on('error', (err) => {
			this.emit('error', err);
		});

		// Register upstreams
		this[_upstreams] = {};
		opts.upstreams && this.registerUpstream(opts.upstreams);

		// Register the routes from the config
		this[_routes] = [];
		opts.routes && this.registerRoute(opts.routes);

		// If onListen then start listening
		if (typeof onListen === 'function') {
			this.listen(onListen);
		}
	}

	/**
	 * Start listening on a port and hostname
	 */
	listen (port, hostname, done = function () {}) {
		if (typeof port === 'function') {
			done = port;
			port = this.port;
			hostname = this.hostname;
		} else if (typeof hostname === 'function') {
			done = hostname;
			hostname = this.hostname;
		}

		this[_server].listen(port, hostname, (err) => {
			this.hostname = hostname;
			this.port = this[_server].address().port;
			done(err);
		});
	}

	/**
	 * Registers the upstream servers
	 *
	 */
	registerUpstream (name, upstream) {
		if (typeof name === 'object') {
			return Object.keys(name).forEach((k) => {
				this.registerUpstream(k, name[k]);
			});
		}

		// Require name and upstream to add
		if (!name) {
			throw new TypeError('upstream name cannot be undefined');
		}
		if (!upstream) {
			throw new TypeError('upstream cannot be undefined');
		}

		upstream.proxy = this[_proxy];
		this[_upstreams][name] = new Upstream(name, upstream);

		return this[_upstreams][name];
	}

	getUpstream (name) {
		return this[_upstreams][name];
	}

	/**
	 * Registers the known routes with the router
	 *
	 */
	registerRoute (r) {
		// Register multiple as an array
		if (Array.isArray(r)) {
			return r.forEach(this.registerRoute.bind(this));
		}

		// If an upstream is specified, replace it with an Upstream instance
		if (typeof r.upstream === 'string' && this.getUpstream(r.upstream)) {
			r.upstream = this.getUpstream(r.upstream);
		} else if (typeof r.upstream === 'object') {
			var name = url.format({
				hostname: r.hostname || 'localhost',
				port: typeof r.port !== 'undefined' ? r.port : 80,
				path: r.path || '/'
			});

			r.upstream = this.registerUpstream(name, r.upstream);
		}

		// Create route object
		var route = new Route(r);
		this[_routes].push(route);

		// Register route handler
		route.methods.forEach((method) => {
			this[_router][method](route.path, (req, res, next) => {
				// Check for matching parameters that are not checked for
				// in the path router, like hostname, next it doesnt match
				if (!route.matches(req)) {
					return next();
				}

				route.handle(req, res, next);
			});
		});
	}

	close (done = function () {}) {
		this[_server].close(() => {
			this.proxy.close(() => {
				done();
			});
		});
	}
}
