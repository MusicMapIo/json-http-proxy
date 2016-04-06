# Configurable Proxy Server

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Build Status](https://travis-ci.org/MusicMapIo/json-http-proxy.svg?branch=master)](https://travis-ci.org/MusicMapIo/json-http-proxy)
[![js-happiness-style](https://img.shields.io/badge/code%20style-happiness-brightgreen.svg)](https://github.com/JedWatson/happiness)

[npm-image]: https://img.shields.io/npm/v/json-http-proxy.svg
[npm-url]: https://npmjs.org/package/json-http-proxy
[downloads-image]: https://img.shields.io/npm/dm/json-http-proxy.svg
[downloads-url]: https://npmjs.org/package/json-http-proxy

A powerful and extensible proxy server which uses a basic JSON schema to configure all of the functionality.  At its core, this is a wrapper around [`node-http-proxy`](https://github.com/nodejitsu/node-http-proxy), which provides the underlying http proxy logic.

The original goal of this project was to run in development when working with microservices.  So you can run all the services localy and use this proxy on port 80 to smartly point different routes to your services.  Since then I have expanded the functionality to be a simple to use "smart" proxy, which you can use to to a plethora of things, including:

- CORS headers
- Modifying request and response body data
- User-agent detection/modification (Ex. serving mobile website views)
- Cookie modifications
- Cacheing proxy

All the functionality for doing this kind of processing is done through a simple plugin system.  Plugins are just a function which are passed the instance of `ProxyServer`.  They can use this instance to hook into events used to modify properties the requests, responses and other functionality.  Even core functionality is implemented as plugins, there are a few built in plugins for some common needs:

- Route upstream handler: Allows registering named upstreams and specifying them in the routes `upstream` field
- CORS: Properly sets the `Access-Control-Allow-Methods` and `Access-Control-Allow-Origin` headers based on the incoming request, also responds to `OPTIONS` requests.
- Cookie modifier: Specify rules for modifying cookie names and values
- Request/Response data modifier: Specify rules for modifying cookie names and values

## Installation

```
$ npm install json-http-proxy
```

## Usage

```
$ json-http-proxy
```

This will start with defaults and load the configuration file called `proxy-config.json`.  Here is an example of this file from our usage:

```
{
	"routes": [
		{
			"hostname": "static-local.musicmap.io",
			"upstream": "client-website"
		},
		{
			"path": "/api/users*",
			"upstream": "api-users"
		},
		{
			"path": "/api/venues*",
			"upstream": "api-venues"
		},
		{
			"path": "/api/broadcasts*",
			"upstream": "api-broadcasts"
		},
		{
			"path": "/*",
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

This file is required in using node's `require` method, so anything that is valid to require can be used here (read "this can be javascript").  The above configuration file defined 4 upstream services which can be mapped to respond do different routes.  The routing uses the Express router, so see [their docs for how to specify paths](http://expressjs.com/guide/routing.html).

## Options

- `hostname`
- `port`
- `routerOptions`
- `changeOrigin`
- `xfwd`
- `headers`
- `plugins`
- `plugins.corsHeaders`
- `plugins.routeUpstreams`
- `plugins.cors`
- `plugins.cookie`
- `upstreams`
- `routes`
