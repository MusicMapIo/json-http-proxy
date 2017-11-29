# Configurable Proxy Server

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Build Status](https://travis-ci.org/MusicMapIo/json-http-proxy.svg?branch=master)](https://travis-ci.org/MusicMapIo/json-http-proxy)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](https://github.com/standard/standard)

[npm-image]: https://img.shields.io/npm/v/json-http-proxy.svg
[npm-url]: https://npmjs.org/package/json-http-proxy
[downloads-image]: https://img.shields.io/npm/dm/json-http-proxy.svg
[downloads-url]: https://npmjs.org/package/json-http-proxy

An extensible proxy server which uses a basic JSON schema to configure all of its functionality.  At its core, this is a wrapper
around [`node-http-proxy`](https://github.com/nodejitsu/node-http-proxy) and the [Express router](https://github.com/pillarjs/router).
The routing determines which upstreams any given request will be proxied to.

The original goal of this project was to run in development when working with microservices.  So you can run all the services localy and use
this proxy on port 80 to point different routes to your services.  Since then I have expanded the functionality to be a simple to
use "smart" proxy, which you can use to to a bunch of things, including:

- Websocket proxying
- CORS headers
- Modifying request and response body data
- User-agent detection/modification (Ex. serving mobile website views)
- Cookie modifications
- Cacheing proxy

All the functionality for doing this kind of processing is done through a simple plugin system.  Plugins are just a
function which are passed the instance of `ProxyServer` and the config options.  They can use this instance to hook into events used to modify
properties the requests, responses and other functionality.  Even some core functionality is implemented as plugins, there are a few built in plugins for some common needs:

- CORS: Properly sets the `Access-Control-Allow-Methods` and `Access-Control-Allow-Origin` headers based on the incoming request, also responds to `OPTIONS` requests.
- Cookie modifier: Specify rules for modifying cookie names and values

## Usage

```
$ npm install -g json-http-proxy
$ json-http-proxy
```

This will load the configuration file called `proxy-config.json`.  Here is an example of this file:

```
{
	"routes": [
		{
			"path": "/api/users/*",
			"upstream": "api-users"
		},
		{
			"path": "/api/venues/*",
			"upstream": "api-venues"
		},
		{
			"path": "/api/broadcasts/*",
			"upstream": "api-broadcasts"
		},
		{
			"upstream": "client-website"
		}
	],
	"upstreams": {
		"client-website": {
			"port": 3000
		},
		"api-users": {
			"port": 3001
		},
		"api-venues": {
			"port": 3002
		},
		"api-broadcasts": {
			"port": 3003
		}
	}
}
```

This file is required in using node's `require` method, so anything that is valid to require can be used here, so this can be javascript.
The above configuration file defined 4 upstream services which can be mapped to respond do different routes.  The routing uses the Express router,
so see [their docs for how to specify paths](http://expressjs.com/guide/routing.html) or use the [express route tester](https://wesleytodd.github.io/express-route-tester/).

## Options

- `address`: the server address to listen on
- `port`: port to open the server on
- `strict`: passed to the router, enables strict routing
- `caseSensitive`: passed to the router, enables case sensitive routing
- `changeOrigin`: passed to `http-proxy`, enables origin changing in the proxy
- `xfwd`: passed to `http-proxy`, enables `x-forwarded-for` headers in the proxy
- `headers`: passed to `http-proxy`, sets headers to be passed to all upstreams
- `ssl`: passed to `http-proxy`, sets ssl keys to use in an https server
- `timeout`: passed to `http-proxy` as `proxyTimeout`
- `plugins`: an object of plugins to initalize where the plugin name is the key
- `upstreams`: an object of upstreams to register where the upstream name is the key
- `routes`: an array of routes to handle
