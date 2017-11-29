# Basic example

This example uses the `ProxyServer` class directly.  It starts a simple http server on `http://localhost:8080` which just responds with the route requested.  The proxy server sets up a single route to proxy from `http://localhost:8081` to the other server on `8080`.

## Usage

Terminal #1:

```
$ cd example/basic && node index.js
```

Then make a request to `http://localhost:8081` and you should see it return `/`.
