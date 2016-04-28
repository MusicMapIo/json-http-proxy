# The basic example

In this example there is a `proxy-config.json` file which you will start the proxy server with.  This will automatically pick up the json file and start the server.  If you then run the `index.js` file and make requests to `http://localhost:8081` which will be proxied to the upstream server.

## Usage

Terminal #1:

```
$ cd example/basic && json-http-proxy
```

Terminal #2:

```
$ cd example/basic && node index.js
```

