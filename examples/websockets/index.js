'use strict'
const http = require('http')
const WebSocket = require('ws')
const WebSocketServer = WebSocket.Server
const ProxyServer = require('../../lib/proxy-server')

var server = http.createServer()
var wss = new WebSocketServer({
  server: server
})

wss.on('connection', function (ws) {
  ws.on('message', function (msg) {
    switch (msg.toString()) {
      case 'ping':
        this.send('pong')
        break
    }
  })
})

var ps = new ProxyServer({
  port: 8081,
  routes: [{
    protocol: 'ws',
    upstream: {
      port: 8080
    }
  }]
})

server.listen(8080, function (err) {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log('Socket server listening on ws://localhost:8080')
  ps.listen(function (err) {
    if (err) {
      console.error(err)
      process.exit(1)
    }
    console.log('Proxy server listening on ws://localhost:8081')

    var ws = new WebSocket('ws://localhost:8081')
    ws.on('error', function (err) {
      console.error(err)
      process.exit(1)
    })
    ws.on('open', function () {
      ws.send('ping')
    })
    ws.on('message', function (data) {
      console.log(data)
      process.exit(0)
    })
    ws.on('close', function () {
      process.exit(0)
    })
  })
})
