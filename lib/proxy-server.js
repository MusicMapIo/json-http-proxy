'use strict'
const http = require('http')
const https = require('https')
const crypto = require('crypto')
const httpProxy = require('http-proxy')
const EventEmitter = require('events')
const Router = require('router')
const finalhandler = require('finalhandler')
const requestHostname = require('request-hostname')
const WebSocket = require('ws')
const upstream = require('./upstream')
const cookiePlugin = require('./cookie')
const corsPlugin = require('./cors')

module.exports = class ProxyServer extends EventEmitter {
  constructor (opts = {}, onListen) {
    super()

    // Save the address and port for the server
    this.address = opts.address || 'localhost'
    this.port = opts.port || null

    // Create a router instance
    this.router = new Router({
      strict: opts.strict || false,
      caseSensitive: opts.caseSensitive || false
    })

    // Create http server
    this.server = opts.server || opts.ssl ? https.createServer(opts.ssl) : http.createServer()
    this.server.on('request', (req, res) => this.handle(req, res))
    this.server.on('upgrade', (req, socket, head) => this.handleUpgrade(req, socket, head))
    this.server.on('error', (err) => this.emit('error', err))

    // Create the proxy server
    this.proxy = httpProxy.createProxyServer({
      changeOrigin: typeof opts.changeOrigin === 'undefined' ? true : opts.changeOrigin,
      xfwd: typeof opts.xfwd === 'undefined' ? true : opts.xfwd,
      headers: opts.headers,
      ssl: opts.ssl,
      proxyTimeout: typeof opts.timeout !== 'undefined' ? parseInt(opts.timeout, 10) : null,
      secure: true
    })
    this.proxy.on('error', (err) => this.emit('error', err))
    this.proxy.on('proxyReq', (proxyReq, req, res, options) => this.emit('proxyReq', proxyReq, req, res, options))
    this.proxy.on('proxyRes', (proxyRes, req, res) => this.emit('proxyRes', proxyRes, req, res))

    // Setup plugins
    var plugins = opts.plugins || {}
    plugins.cookie = opts.cookie && cookiePlugin
    plugins.cors = opts.cors && corsPlugin
    Object.keys(plugins).forEach((p) => plugins[p] && plugins[p](this, opts))

    // Setup upstreams
    this.upstreams = Object.keys(opts.upstreams || {}).reduce((upstreams, name) => {
      if (upstreams[name]) {
        this.emit('error', new Error('Cannot have two upstreams with the same name'))
      } else {
        this.emit('upstream', opts.upstreams[name])

        // Create upstream middleware
        upstreams[name] = upstream(this.proxy, opts.upstreams[name])
      }

      return upstreams
    }, {})

    // Setup routes
    opts.routes && opts.routes.forEach((route) => {
      (route.methods || ['all']).forEach((m) => {
        this.router[m.toLowerCase()](route.path || '*', (req, res, next) => {
                          // Check for hostname match
          if (route.hostname && requestHostname(req) !== route.hostname) {
            return next('route')
          }

          // For routes without an upstream, just send back a 404
          if (!route.upstream) {
            return res.status(404).send()
          }

          // If we have an upstream by name, proxy it
          if (typeof route.upstream === 'string' && this.upstreams[route.upstream]) {
            return this.upstreams[route.upstream](req, res)
          }

          // If we have an upstream object, create the upstream and proxy it
          if (typeof route.upstream === 'object') {
            return upstream(this.proxy, route.upstream)(req, res)
          }
        })
      })
    })

    if (typeof onListen === 'function') {
      this.listen(onListen)
    }
  }

  handle (req, res) {
    // Run router
    this.router(req, res, finalhandler(req, res, {
      onerror: (err) => {
        this.emit('error', err)
      }
    }))
  }

  handleUpgrade (req, socket, head) {
    // @TODO Remove this super hack :)
    req.__jhp_socket_head_halp_me_plz = head

    // Run router
    this.router(req, socket, function () {
      // Cleanly open the socket, but with a 404, then close
      socket.write([
        'HTTP/1.1 404 Not Found',
        'Upgrade: websocket',
        'Connection: Upgrade',
        'Sec-WebSocket-Accept: ' + crypto.createHash('sha1').update(req.headers['sec-websocket-key'] + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11', 'binary').digest('base64'),
        '\r\n'
      ].join('\r\n'))
      var con = new WebSocket([socket, head], null, {
        protocolVersion: +req.headers['sec-websocket-version'],
        extensions: {},
        protocol: (req.headers['sec-websocket-protocol'] || '').split(/, */)[0]
      })
      // 1001 going away
      con.close(1001)
    })
  }

  listen (port, address, done) {
    if (typeof port === 'function') {
      done = port
      port = this.port
      address = this.address
    } else if (typeof address === 'function') {
      done = address
      address = this.address
    } else if (typeof done !== 'function') {
      done = function () {}
    }

    // Start the server
    this.server.listen(port, address, (err) => {
      var addr = this.server.address()
      this.port = (addr) ? addr.port : this.port
      done(err)
    })
  }

  close (done) {
    this.server.close((err1) => {
      this.proxy.close((err2) => {
        typeof done === 'function' && done(err1 || err2)
      })
    })
  }
}
