# Configurable Proxy Server

**NOTE: this is ALPHA software, use with caution until otherwise stated**

This proxy server uses a JSON configuration file to define upstream services to proxy to.  The main goal of this project is to run in development when working with microservices.  So you can run all the services localy and use this proxy on port 80 to smartly point different routes to your services.

The reason you would use this instead of nginx or just hard coding host/ports is that this provides smart handling of things like CORS headers and cookie modifications.  We use this module to develop locally while pointing certian request to production servers so we can load real live data.

## Usage

```
$ npm install json-http-proxy
$ json-http-proxy
```

This will start with defaults and load the configuration file called `proxy-config.json`.  Here is an example of this file from our usage

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
