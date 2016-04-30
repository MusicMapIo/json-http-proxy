var cookie = require('cookie');
var setCookie = require('set-cookie-parser');

module.exports = function router (proxyServer, opts = {}) {
	var requestCookies = opts.plugins && opts.plugins.cookie && opts.plugins.cookie.request;
	var requestCookieKeys = requestCookies && Object.keys(requestCookies);

	var responseCookies = opts.plugins && opts.plugins.cookie && opts.plugins.cookie.response;
	var responseCookieKeys = responseCookies && Object.keys(responseCookies);

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
	if (responseCookies) {
		proxyServer.on('proxyRes', function (pRes, req, res) {
			var cookies = {};

			// Parse the cookies from the response
			var pc = setCookie.parse(pRes).reduce(function (pc, c) {
				pc[c.name] = c;
				return pc;
			}, {});

			responseCookieKeys.forEach(function (key) {
				// This cookie was not set, but set it if setIfNotExists is true
				if (!pc[key]) {
					if (responseCookies[key].setIfNotExists) {
						// The setIfNotExists flag requires a value
						if (!responseCookies[key].value) {
							return;
						}

						// Seralize the new cookie
						cookies[responseCookies[key].name || key] = {
							value: responseCookies[key].value,
							path: responseCookies[key].path || '/',
							domain: responseCookies[key].domain,
							maxAge: responseCookies[key].maxAge,
							httpOnly: responseCookies[key].httpOnly,
							secure: responseCookies[key].secure,
							firstPartyOnly: responseCookies[key].firstPartyOnly
						};
					}
					return;
				}

				// Get cookie properties
				var name = responseCookies[key].name || pc[key].name;
				var val = responseCookies[key].value || pc[key].value;
				var path = responseCookies[key].path || pc[key].path;
				var domain = responseCookies[key].domain || pc[key].domain;
				var maxAge = responseCookies[key].maxAge || pc[key].maxAge;
				var httpOnly = typeof responseCookies[key].httpOnly !== 'undefined' ? responseCookies[key].httpOnly : pc[key].httpOnly;
				var secure = typeof responseCookies[key].secure !== 'undefined' ? responseCookies[key].secure : pc[key].secure;
				var firstPartyOnly = typeof responseCookies[key].firstPartyOnly !== 'undefined' ? responseCookies[key].firstPartyOnly : pc[key].firstPartyOnly;

				// Seralize the new cookie
				cookies[name] = {
					value: val,
					path: path,
					domain: domain,
					maxAge: maxAge,
					httpOnly: httpOnly,
					secure: secure,
					firstPartyOnly: firstPartyOnly
				};

				// Should we keep the old cookie?
				if (!responseCookies[key].replace && name !== pc[key].name) {
					cookies[pc[key].name] = {
						value: val,
						path: path,
						domain: domain,
						maxAge: maxAge,
						httpOnly: httpOnly,
						secure: secure,
						firstPartyOnly: firstPartyOnly
					};
				}

				// Remove from pc object so we dont set it on accident later
				delete pc[key];
			});

			// Pass over other cookies that dont have modification rules
			Object.keys(pc).forEach(function (name) {
				var c = pc[name];
				if (cookies[name]) {
					return;
				}

				cookies[name] = {
					value: c.value,
					path: c.path,
					domain: c.domain,
					maxAge: c.maxAge,
					httpOnly: c.httpOnly,
					secure: c.secure,
					firstPartyOnly: c.firstPartyOnly
				};
			});

			var headers = Object.keys(cookies).map(function (c) {
				return cookie.serialize(c, cookies[c].value, cookies[c]);
			});
			pRes.headers['set-cookie'] = headers;
		});
	}
};
