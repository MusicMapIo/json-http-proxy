"use strict";

// External deps use normal require
var http = require('http');
var httpProxy = require('http-proxy');
var Router = require('router');

// Internal deps use ES6 module syntax
import {Upstream} from './upstream';
import {Route} from './route';

export class ProxyServer {

	constructor(opts = {}) {
		// Save the host and port the server was opened on
		this.hostname = opts.hostname || null;
		this.port = opts.port || null;

		// Create router
		this.router = new Router(opts.routerOptions);

		// Create http server
		this.server = http.createServer((req, res, next) => {
			this.router(req, res, function() {
				// do after stuff
				console.log('WAT?', req.url);
			});
		});

		// Create the proxy server
		this.proxy = httpProxy.createProxyServer({
			changeOrigin: true
		});
		this.proxy.on('error', function(err) {
			console.error(err);
		});

		// Register upstreams
		this.upstreams = {};
		this.registerUpstreams(opts.upstreams);

		// Register the routes from the config
		this.routes = [];
		this.registerRoutes(opts.routes);
	}

	/**
	 * Start listening on a port and hostname
	 */
	listen(port = this.port, hostname = this.hostname, ready = function(){}) {
		this.server.listen(port, hostname, err => {
			this.hostname = hostname;
			this.port = this.server.address().port;
			ready(err);
		});
	}

	/**
	 * Registers the upstream servers
	 *
	 */
	registerUpstreams(upstreams) {
		Object.keys(upstreams).forEach(k => {
			upstreams[k].proxy = this.proxy;
			this.upstreams[k] = new Upstream(k, upstreams[k]);
		});
	}

	/**
	 * Registers the known routes with the router
	 *
	 */
	registerRoutes(routes) {
		// For each route, register handler method
		routes.forEach(r => {
			// If an upstream is specified, replace it 
			if (r.upstream && this.upstreams[r.upstream]) {
				r.upstream = this.upstreams[r.upstream];
			}

			// Create route object
			var route = new Route(r);
			this.routes.push(route);

			// Register route handler
			this.router[route.method](route.path, (req, res, next) => {
				// Check for matching parameters that are not checked for
				// in the path router, like hostname, next it doesnt match
				if (!route.matches(req)) {
					return next();
				}

				route.handle(req, res, next);
			});
		});
	}

}
