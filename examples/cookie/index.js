'use strict'
const http = require('http')
const cookie = require('cookie')
const ProxyServer = require('../../lib/proxy-server')

var s = http.createServer(function (req, res) {
  console.log('Upstream request recieved: ' + req.url, req.headers && req.headers.cookie)
  if (req.url === '/foo') {
    res.setHeader('set-cookie', cookie.serialize('foo', 'bar', {
      path: '/foo',
      maxAge: 60,
      httpOnly: true
    }))
  } else if (req.url === '/bar') {
    res.setHeader('set-cookie', [cookie.serialize('baz', 'foz', {
      path: '/',
      maxAge: 60
    }), cookie.serialize('bar', 'fob', {
      path: '/bar'
    })])
  } else if (req.url === '/foobar') {
    res.setHeader('set-cookie', cookie.serialize('foobar', 'bazfoz', {
      expires: new Date(Date.now() + (1000 * 60 * 60 * 24)) // 1 day
    }))
  }
  res.statusCode = 200
  res.end('cookie')
})

var ps = new ProxyServer({
  port: 8081,
  routes: [{
    upstream: {
      port: 8080
    }
  }],
  cookie: {
    request: {
      foo: {
        name: 'bar',
        replace: true
      },
      baz: {
        name: 'barz'
      },
      foz: {
        value: 'faz'
      }
    },
    response: {
      foo: {
        name: 'bax',
        domain: '.localhost'
      },
      bar: {
        name: 'barz',
        replace: true,
        maxAge: 60
      },
      foobar: {
        value: 'zofza',
        setIfNotExists: true
      }
    }
  }
})

s.listen(8080, function (err) {
  if (err) {
    console.error(err)
    process.exit()
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
