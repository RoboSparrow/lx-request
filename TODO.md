x xapi /statements/more: learninglocker
x testability/ more url: add run-time overwrite for config.lrs to config
x eslint, switch to a base template
x promise support
x xapi legacy & req.application/x-www-form-urlencoded
x xapi statements: cap
x xapi switch lrs config for single calls
x global promise option
- req.form, req plain, what to do with req.raw?
x ~~accept headers~~ leave to client
x req.mergeHash rewrite
x ~~req.request(), req.xapi() retain initial config instance ?~~ nope, leave as basic mutation killer

moved to next stage

- debug mode: response with config, url & benchmark millisec
- handle redirects in xhr and http: redirects: https://www.mattlunn.me.uk/blog/2012/05/handling-a-http-redirect-in-node-js/
- req._parseRequestBody: rewrite consider content-type header
- review _encodeQuery
- responseType: remove option, see restrtictions and pityfalls on MDN
- xhr onerror > error
- error catching json parse
- if (xhr.status < 299 && !result.error)

- documentation
- ES6 modules
