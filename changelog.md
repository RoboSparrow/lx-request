0.0.1

- initial app

0.1.0

- new `req.xapi.statements()` method: automatic aggregation of GET /statements with `more` urls
Currently supported more patterns: (lxHive, learninglocker, scorm cloud, lrs.adlnet.gov)
A allback can be submitted for parsing custom `more` patterns against the configured lrs
- better json request check
- case insensitive header property access
- Improved encoding of complex config.query param values (objects, arrays) for json requests.
They are now automatically stringified if the request is a json request, otherwise encoded php-like as before
