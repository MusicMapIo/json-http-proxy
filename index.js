// This is mostly for support of the es6 module export
// syntax with the babel compiler, it looks like it doesnt support
// function exports like we are used to in node/commonjs
module.exports = require('./lib/proxy-server').ProxyServer;
module.exports.Route = require('./lib/route').Route;
module.exports.Upstream = require('./lib/upstream').Upstream;
