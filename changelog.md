### 0.0.1

- initial app

### 0.1.0

- new `req.xapi.statements()` method: automatic aggregation of GET /statements with `more` urls
Currently supported more patterns: (lxHive, learninglocker, scorm cloud, lrs.adlnet.gov)
A allback can be submitted for parsing custom `more` patterns against the configured lrs
- better json request check
- case insensitive header property access
- Improved encoding of complex config.query param value headers (objects, arrays) for json requests.
They are now automatically stringified if the request is a json request, otherwise encoded php-like as before

### 0.3.0

New

* req
    - ES6 Promise mode for all requests, i.e. `req.post(config,data).then()...`, `req.xapi.get(api, config).then()...` config.success and config.error cllbacks are ignored
    - `req.ASYNC='promise'|'callback` global configure asynchronous mode. Default is "callback"
    - `config.promise=true|false` set async mode for a single request (default: false)
    - `config.serialiser=function(data){return <string>;}` optionally inject custom serializer for config.data
    - req presets: `config.preset='json'|'plain'|'form'|'raw'`
        - presets setting headers (overwrite) and default body serializer according to content types, one of these values:
        - json:     application/json
        - plain:    text/plain
        - form:     application/x-www-form-urlencoded
        - raw:      full manual mode, no headers and serializer
    - req methods for each preset: `req.json(), req.plain(), req.form(), req.raw()`
    - `config.transformRequest=function(config, data, requestInstance)` callback for inspecting a processed request who is about to be sent
        - config: processed `req.config`, changes have no effect
        - data: (string|null) serialized data, changes have no effect
        - requestInstance: xhr or http request instance. you *may* apply changes here

* req.xapi
    - `req.xapi.statements(config, options)` aggregator refactor,
        - added promise support (req.AYSYNC|config.promise)
        - `options.cap=<number>` optional max statements cap: resolves aggregation if gstatements.length >= cap.
        - `options.nextFn = function(resonse, config){return <uri>l|null;}` optional cb for compiling next request uri
        - `options.dataFn = function(resonse, config){return <array>;}`  optional cb for extracting records from single response
    - new `config.xapi`, overwrite global lrs configruation for single requests
        - `config.xapi.lrs=<uri>`
        - `config.xapi.auth=<base64(user:password)>`
        - `config.xapi.version=<semver string>`
        - `config.xapi.legacy=true|false`

* Breaking changes
    - headers names (`config.headers` properites) are now normalized to fistletter uppercase (with dash as wordbreak),
        - i.e `/CONTENT-TYPE/i` is normalized to `Content-Type`
    - `req.raw()` behavioural change: manual request, headers and serialization need to be set
    - removed option `config.responseType` (based on xhr.responseType) removed as it is problematic (webworkes etc)
        - use `config.preset="json"` instead
    - xapi legacy requests ("CORS mode"), complete rewrite, building the POST data has changed
    - `req.xapi.statements()` aggregator: arguments have changed, takes now 1) req.config and 2) a separate aggregator config object
    - serializers throw custom exceptions (parsers don't)

* Other changes/refactor:
    - refactor serializer
    - refactor request header
    - refactor search aggregator
    - new tests
    - `extend()`, rewrite deep merge objects
