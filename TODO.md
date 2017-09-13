x xapi /statements/more: learninglocker
x testability/ more url: add run-time overwrite for config.lrs to config
x eslint, switch to a base template
- handle redirects in xhr and http: redirects: https://www.mattlunn.me.uk/blog/2012/05/handling-a-http-redirect-in-node-js/
x promise support
- global promise option
- debug mode: response wit config, url & benchmark millisec
- req.mergeHash rewrite
- req.request(), req.xapi() retain initial config instance ?
- req._parseRequestBody: rewrite consider content-type header
- review _encodeQuery
- responseType: remove option, see restrtictions and pitifalls on MDN

- xhr onerror > error
- error catching json parse
- if (xhr.status < 299 && !result.error)

- documentation
- ES6 modules
