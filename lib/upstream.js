'use strict'
const url = require('url')

module.exports = function upstream (proxy, opts = {}) {
  if (!proxy) {
    throw new TypeError('proxy is required')
  }

  var protocol = opts.protocol || 'http'
  var hostname = opts.hostname || 'localhost'
  var port = typeof opts.port !== 'undefined' ? opts.port : (opts.protocol === 'https' || opts.protocol === 'wss' ? 443 : 80)
  var path = opts.path || '/'
  var formattedTargetUrl = url.format({
    protocol: protocol,
    hostname: hostname,
    port: port,
    path: path
  })

  return function handleUpstream (req, res) {
    // This is a socket
    // @TODO fix this plz
    if (req.__jhp_socket_head_halp_me_plz) {
      proxy.ws(req, res, req.__jhp_socket_head_halp_me_plz, {
        target: formattedTargetUrl
      })
      return
    }

    proxy.web(req, res, {
      target: formattedTargetUrl
    })
  }
}
