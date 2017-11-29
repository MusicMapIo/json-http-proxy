/* global describe, it */
'use strict'
const ProxyServer = require('../lib/proxy-server')
const assert = require('assert')
const http = require('http')
const parallel = require('run-parallel')

describe('json-http-proxy', function () {
  it('exposed interface should look correct', function () {
    var ps = new ProxyServer()
    assert.equal(ps.hostname, null)
    assert.equal(ps.port, null)
    assert.equal(typeof ps.listen, 'function')
    assert.equal(typeof ps.close, 'function')
  })

  it('should start listening', function (done) {
    var ps = new ProxyServer()
    assert.doesNotThrow(function () {
      ps.listen(function (err) {
        assert(!err)
        assert.notEqual(ps.port, null)
        ps.close()
        done()
      })
    })
  })

  it('should start listening on a port', function (done) {
    var ps = new ProxyServer()
    ps.listen(46570, function (err) {
      assert(!err)
      assert.equal(ps.port, 46570)
      ps.close()
      done()
    })
  })

  it('should add upstreams', function () {
    var ps = new ProxyServer({
      upstreams: {
        test: {
          protocol: 'http:',
          hostname: 'localhost',
          port: 1234
        }
      }
    })
    assert(ps.upstreams['test'])
    assert(typeof ps.upstreams['test'] === 'function')
  })

  it('should proxy a route to an upstream', function (done) {
    startServer('test', function (port, close) {
      var ps = new ProxyServer({
        routes: [{
          path: '/test',
          upstream: {
            port: port
          }
        }]
      }, function (err) {
        if (err) {
          throw err
        }

        http.get('http://localhost:' + ps.port + '/test', function (res) {
          assert.equal(res.statusCode, 200)
          res.on('data', function (d) {
            assert.equal(d, 'test')
            ps.close()
            close()
            done()
          })
        })
      })
    })
  })

  it('should proxy a route to an named upstream', function (done) {
    startServer('test', function (port, close) {
      var ps = new ProxyServer({
        routes: [{
          path: '/test',
          upstream: 'test'
        }],
        upstreams: {
          test: {
            port: port
          }
        }
      }, function (err) {
        if (err) {
          throw err
        }

        http.get('http://localhost:' + ps.port + '/test', function (res) {
          assert.equal(res.statusCode, 200)
          res.on('data', function (d) {
            assert.equal(d, 'test')
            ps.close()
            close()
            done()
          })
        })
      })
    })
  })

  it('should proxy multiple routes', function (done) {
    startServer('test', function (port, close) {
      var ps = new ProxyServer({
        routes: [{
          path: '/foo',
          upstream: 'test'
        }, {
          path: '/bar',
          upstream: 'test'
        }],
        upstreams: {
          test: {
            port: port
          }
        }
      }, function (err) {
        if (err) {
          throw err
        }

        parallel([function (d1) {
          http.get('http://localhost:' + ps.port + '/foo', function (res) {
            assert.equal(res.statusCode, 200)
            res.on('data', function (d) {
              assert.equal(d.toString(), 'test')
              d1()
            })
          })
        }, function (d2) {
          http.get('http://localhost:' + ps.port + '/bar', function (res) {
            assert.equal(res.statusCode, 200)
            res.on('data', function (d) {
              assert.equal(d.toString(), 'test')
              d2()
            })
          })
        }], function () {
          ps.close()
          close()
          done()
        })
      })
    })
  })
})

// Create a http server for a route
function startServer (name, done) {
  var s = http.createServer(function (req, res) {
    res.statusCode = 200
    res.end(name)
  })
  s.listen(null, function () {
    done(s.address().port, function () {
      s.close()
    })
  })
}
