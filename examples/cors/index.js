'use strict'
const path = require('path')
const http = require('http')
const send = require('send')
const ProxyServer = require('../../')

var s = http.createServer(function (req, res) {
  console.log('Upstream request recieved: ' + req.method + ' ' + req.url)
  if (req.url === '/' && req.method === 'PUT') {
    res.statusCode = 204
    res.end()
    return
  }
  if (req.url === '/' && req.method === 'GET') {
    send(req, path.join(__dirname, '/index.html')).on('error', function (err) {
      console.error(err)
      res.statusCode = err.status || 500
      res.end(err.message)
    }).pipe(res)
    return
  }
  if (req.url === '/data.json' && req.method === 'GET') {
    send(req, path.join(__dirname, '/data.json')).pipe(res)
    return
  }
  res.statusCode = 404
  res.end('404 Not Found')
})

var ps = new ProxyServer({
  port: 8081,
  routes: [{
    path: '*',
    upstream: {
      port: 8080
    }
  }],
  cors: true
})

s.listen(8080, function (err) {
  if (err) {
    console.error(err)
    process.exit()
  }
  console.log('Server running on localhost:8080')
  ps.listen(function (err) {
    if (err) {
      console.error(err)
      process.exit()
    }
    console.log('Proxy running on localhost:8081')
  })
})
