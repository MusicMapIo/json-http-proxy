var cookie = require('cookie');

module.exports = function router (proxyServer, opts = {}) {
	var requestCookies = opts.plugins && opts.plugins.cookie && opts.plugins.cookie.request;
	var requestCookieKeys = requestCookies && Object.keys(requestCookies);

	// var responseCookies = opts.plugins && opts.plugins.cookie && opts.plugins.cookie.response;
	// var responseCookieKeys = responseCookies && Object.keys(responseCookies);

	// Modify cookies as they get sent
	if (requestCookies) {
		proxyServer.on('proxyReq', function (pReq, req, res, o) {
			// Parse the cookies from the request
			var pc = (req.headers && req.headers.cookie && cookie.parse(req.headers.cookie)) || {};

			// Loop through the cookies we are changing
			requestCookieKeys.forEach(function (key) {
				var copts = requestCookies[key];

				// Change the name
				if (copts.name) {
					// Set the value of the new cookie
					pc[copts.name] = pc[key];

					// Replace the old cookie
					if (copts.replace) {
						delete pc[key];
					}
				}

				// Set the value of the new cookie
				if (copts.value) {
					pc[copts.name || key] = copts.value;
				}
			});

			pReq.setHeader('cookie', Object.keys(pc).map(function (k) {
				return cookie.serialize(k, pc[k]);
			}).join(';'));
		});
	}

	// Modify cookies as they are set from the server
	// @TODO make this work
	/*
	if (responseCookies) {
		proxyServer.on('proxyRes', function (pRes, req, res) {
			var cookies = [];

			// Parse the cookies from the response
			var pc = (pRes.headers && pRes.headers['set-cookie'] || []).map(function (c) {
				return cookie.parse(c);
			});

			responseCookieKeys.forEach(function (key) {
				pc.forEach(function (c) {
					// No modifications for this cookie
					if (!c[key]) {
						return;
					}

					var copts = responseCookies[key];
					if (copts.name) {

					}
				});

				if (copts.name) {
					pc[copts.name] = pc[key];

					// Replace the old cookie
					if (copts.replace) {
						delete pc[key];
					}
				}
			});
		});
	}
	*/
};
