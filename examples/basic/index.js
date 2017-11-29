'use strict'
const http = require('http')
const ProxyServer = require('../../lib/proxy-server')

var s = http.createServer(function (req, res) {
  res.statusCode = 200
  res.end(req.url)
})

var ps = new ProxyServer({
  port: 8081,
  routes: [{
    upstream: {
      port: 8080
    }
  }]
})

s.listen(8080, function (err) {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log('Upstream running on localhost:8080')

  ps.listen(function (err) {
    if (err) {
      console.error(err)
      process.exit(1)
    }
    console.log('Proxy running on localhost:8081')
  })
})
