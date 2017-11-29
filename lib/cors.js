'use strict'

module.exports = function (proxy, opts = {}) {
  // Handle OPTIONS requests
  proxy.router.options('*', function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', req.headers['origin'])
    res.setHeader('Access-Control-Allow-Methods', req.headers['access-control-request-method'])
    res.statusCode = 200
    res.end()
  })

  // Set the correct cors heades for all responses
  proxy.on('proxyRes', function (proxyRes, req) {
    // Set cors headers
    proxyRes.headers['Access-Control-Allow-Origin'] = req.headers['origin'] || req.headers['host']
    proxyRes.headers['Access-Control-Allow-Methods'] = req.method
    if (opts.cors.headers) {
      proxyRes.headers['Access-Control-Allow-Headers'] = opts.cors.headers.join(', ')
    }
  })
}
