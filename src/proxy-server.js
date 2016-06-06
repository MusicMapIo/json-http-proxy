// External deps use normal require
var http = require('http');
var https = require('https');
var httpProxy = require('http-proxy');
var EventEmitter = require('events');
var Router = require('router');
var finalhandler = require('finalhandler');

// Internal deps use ES6 module syntax
import {Upstream} from './upstream';
import {Route} from './route';
import {WsRoute} from './ws-route';

// Private stuff
const _proxy = Symbol('proxy');
const _upstreams = Symbol('upstreams');
const _routes = Symbol('routes');
const _wsRoutes = Symbol('websocketRoutes');
const _server = Symbol('server');

export class ProxyServer extends EventEmitter {
	constructor (opts = {}, onListen) {
		super();

		// Save the host and port the server was opened on
		this.hostname = opts.hostname || null;
		this.port = opts.port || null;

		// Create a router instance to hook middleware into
		this.router = new Router(opts.routerOptions);

		// Create a websocket object to hook middleware into
		this.wsRouter = {};

		// Create http server
		this[_server] = opts.server || opts.ssl ? https.createServer(opts.ssl) : http.createServer();
		this[_server].on('request', (req, res) => {
			this.handle(req, res);
		});
		this[_server].on('error', (err) => {
			this.emit('error', err);
		});
		// Adds support for Websockets
		this[_server].on('upgrade', (req, socket, head) => {
			this.handleWebsocket(req, socket, head);
		});

		// Create the proxy server
		this[_proxy] = httpProxy.createProxyServer({
			changeOrigin: typeof opts.changeOrigin === 'undefined' ? true : opts.changeOrigin,
			xfwd: typeof opts.xfwd === 'undefined' ? true : opts.xfwd,
			headers: opts.headers,
			ssl: opts.ssl,
			secure: true,
			ws: true
		});
		this[_proxy].on('error', (err) => {
			this.emit('error', err);
		});
		this[_proxy].on('proxyReq', (proxyReq, req, res, options) => {
			this.emit('proxyReq', proxyReq, req, res, options);
		});
		this[_proxy].on('proxyRes', (proxyRes, req, res) => {
			this.emit('proxyRes', proxyRes, req, res);
		});

		//
		// Setup plugins
		//
		var plugins = Object.assign({}, opts.plugins || {});

		// Use the router upstreams plugin
		if (plugins.routeUpstreams !== false) {
			this.initPlugin('./plugins/route-upstream', opts);
			delete plugins.routeUpstream;
		}

		// Use the cors plugin
		if (plugins.cors !== false) {
			this.initPlugin('./plugins/cors', opts);
			delete plugins.cors;
		}

		// Use the cookie plugin
		if (plugins.cookie) {
			this.initPlugin('./plugins/cookie', opts);
			delete plugins.cookie;
		}

		// Load custom plugins
		this.initPlugin(plugins, opts);

		// Register upstreams
		this[_upstreams] = {};
		opts.upstreams && this.registerUpstream(opts.upstreams);

		// Register the routes from the config
		this[_routes] = [];
		opts.routes && this.registerRoute(opts.routes);

		// Register Websockets
		this[_wsRoutes] = [];
		opts.websockets && this.registerWebsocketRoute(opts.websockets);

		// If onListen then start listening
		if (typeof onListen === 'function') {
			this.listen(onListen);
		}
	}

	/**
	 * Start listening on a port and hostname
	 *
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
	 * Initialize plugins
	 *
	 */
	initPlugin (plugin, opts) {
		// Init multiple if an array
		if (typeof plugin === 'object') {
			return Object.keys(plugin).map((k) => {
				return this.initPlugin(k, opts);
			});
		}

		try {
			var p = require(plugin);
		} catch (e) {
			return this.emit('error', e);
		}

		this.emit('pluginInitialized', plugin);
		p(this, opts);
	}

	/**
	 * Registers the upstream servers
	 *
	 */
	registerUpstream (name, upstream) {
		if (typeof name === 'object') {
			return Object.keys(name).map((k) => {
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

		// Plugin hook
		this.emit('registerUpstream', name, this[_upstreams][name]);

		return this[_upstreams][name];
	}

	/**
	 * Get an upstream that has been registered with a given name
	 *
	 */
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
			return r.map(this.registerRoute.bind(this));
		}

		// Create route object
		var route = new Route(r);
		this[_routes].push(route);

		// Plugin hook
		this.emit('registerRoute', route);

		// Request handler method
		var handleRequest = function handleRequest (req, res, next) {
			// Check for hostname match
			if (req.headers && route.hostname && req.headers.host !== route.hostname) {
				return next();
			}

			// Matched a route, handle request
			route.handle(req, res, next);
		};

		// Register route handlers for each supported method
		route.methods.forEach((method) => {
			this.router[method](route.path, handleRequest);
		});

		return route;
	}

	/**
	 * Handle a request
	 *
	 */
	handle (req, res) {
		this.router(req, res, finalhandler(req, res, {
			onerror: (err) => {
				this.emit('error', err);
			}
		}));
	}

	handleWebsocket (req, socket, head) {
		// setup basic req values
		req.baseUrl = req.baseUrl || '';
		req.originalUrl = req.originalUrl || req.url;

		// check for a matched route
		this[_wsRoutes].forEach((route) => {
			// Is the method allowed
			if (route.methods.indexOf(req.method)) {
				// Does the route match
				if (req.url.match(route.regEx) !== null) {
					route.handleRequest(req, socket, head);
				}
			}
		});
	}

	/**
	 * Register the websocket routes with the proxy
	 *
	 */
	registerWebsocketRoute (s) {
		// Register multiple as an array
		if (Array.isArray(s)) {
			return s.map(this.registerWebsocketRoute.bind(this));
		}

		// Create route object
		var route = new WsRoute(s);

		// Plugin hook
		this.emit('registerRoute', route);

		// Request handler method
		route.handleRequest = function handleRequest (req, socket, head, next) {
			// Check for hostname match
			if (req.headers && route.hostname && req.headers.host !== route.hostname) {
				return next(req, socket, head);
			}

			// Matched a route, handle request
			route.handle(req, socket, head, next);
		};

		// Add the route
		this[_wsRoutes].push(route);

		return route;
	}

	/**
	 * Close the server
	 *
	 */
	close (done = function () {}) {
		this[_server].close(() => {
			this.proxy.close(() => {
				done();
			});
		});
	}
}

