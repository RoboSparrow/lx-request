# lxRequest

A lightwight http request library. Transparent and *dependency free* requests via XMLHttpRequest (XHR) or node HTTP module.

- Zero dependencies: no package hell <sup>1</sup>
- Runs in Node.js or browser
- Written in **ES3**: runs on legacy node and browser versions (e.g. IE6, node v4.9.1)
- [xAPI](https://github.com/adlnet/xAPI-Spec/blob/master/xAPI.md) conform requests and xAPI statement aggregation
- Promise or callback mode
- Small and extendable
- Configurable: globally or per request
- Transparent: great for testing
- Presets: preconfigured requests


<sup>1)</sup> except `devDependencies`

# Contents

* [Request](#req)
    - [Presets](#req-presets)
    - [Options](#req-options)
    - [Response](#req-response)
    - [Request options](#req-options)
    - [Global configuration](req-config)
* [xAPI Requests](#req-xapi)
    - [Request options](#xapi-options)
    - [Global configuration](#xapi-config)
    - [Statement aggreation](#xapi-aggregation)

# HTTP Requests<a name="req"></a>

## Usage

Node

```javascript
// default requests
var req = require('./req.js');
// xAPI requests
var req = require('./req.xapi.js');

```

Browser

```html
<script src="./req/req.js"></script>
<script src="./req/req.xapi.js"></script>
```

## Making requests

```javascript
req.request(<uri>, options);
req.request(<uri>, { promise:true }).then(...);
```

Callback request example (default)

```javascript
req.request(<url>, {
    method: 'POST',
     // payload data
    data: {
        key: 'value'
    },
    preset: 'json',
    // success callback
    success: function(response, http|xhr instance) {
        console.log('success', response.status + ': ' + response.statusText);
        console.log('data', response.data); // parsed JSON (preset)
    },
    // error callback
    error: function(response, http|xhr instance) {
        console.error('error', response.status + ': ' + response.statusText);
        console.log('data', response.data); // parsed, if JSON (preset)
    },
    // on error or success
    always: function(response, http|xhr instance, options) {
        console.log('success', response.status + ': ' + response.statusText);
        console.log('data', response.data); // parsed, if JSON (preset)
        console.log('transformed options', options);
    }
});
```

Promise request example

```javascript
req.request(url + '/200', {
    method: 'POST',
    // payload data
    data: {
        key: 'value'
    },
    // handle json
    preset: 'json',
    // triggers promise, alternatively set global req.ASYNC = 'promise'
    promise: true,
    // error and success callbacks are disabled
    always: function(response, http|xhr instance, options) {
        console.log('success', response.status + ': ' + response.statusText);
        console.log('data', response.data); // parsed, if JSON (preset)
        console.log('transformed options', options);
    }
})
.then(function(response) {
    console.log('success', response.status + ': ' + response.statusText);
    console.log('data', response.data); // parsed JSON
})
.catch(function(response) {
    console.log('error', response.status + ': ' + response.statusText);
    console.log('data', response.data); // parsed, if JSON (preset)
})
;
```

### Preconfigured requests<a name="req-presets"></a>

By method

```javascript
req.post('<string:url>', <object:data>, <object:options>);
req.put('<string:url>', <object:data>, <object:options>);
req.get('<string:url>', <object:options>);
req.head('<string:url>', <object:options>);
req.delete('<string:url>', <object:options>);
```
by content type

```javascript
req.json('<string:url>', <object:options>);  // application/json
req.form('<string:url>', <object:options>);  // application/x-www-form-urlencoded
req.plain('<string:url>', <object:options>); // text/plain
req.raw('<string:url>', <object:options>);   // no content type, alias of req.request()
```

## Request options<a name="req-options"></a>

```javascript
var defaults = {
    method: 'GET',              // request method
    promise: false,             // return promise or use "success" and "error" calback options. if set to true these callbacks will be ignored
    query: {},                  // query params object (key, value)
    headers: {},                // header object (key, value), maybe overwritten by "preset" option
    preset: '',                 // 'json', 'form', 'plain', 'raw'
    serialize: false,           // custom serializer function. taking data and returning string function(data) { return data;}
    beforeSend: false,          // inspect a request who is about to be sent. Config changes will have no effect function(mergedConfig, parsedData, http|xhr){}
    transformResponse: false,   // function(result) { return response; }
    success: function() {},     // success callback function (response, http|xhr) {} omitted in promise mode
    error: function() {},       // error callback function (response, http|xhr) {} omitted in promise mode
    always: function() {}       // this callback is always invoked (response, http|xhr, config)
};
```
## Global configuration<a name="req-config"></a>

Global configuration allows you to change the behaviour for all requests

### `ASYNC`

`req.ASYNC`: set callback or promise mode for all request: either '`callback`' (default) or `'promise'`

```javascript
req.ASYNC = 'promise';

req.get(<uri>).then(() => {
    alert("Look Ma, it's a promise!");
});

```

`req.Promise`: optional ES6 Promise shim/substitute

### LOGFN

`req.LOGFN`: sets global callback function for logging of requests

```javascript
var ticks = 0;
req.LOGFN = function(response, config) {
    tick++;
    console.log(tick, JSON.stringify({response, config}));
};

req.get(<uri-1>).then(() => console.assert(tick === 1, 'increment'));
req.get(<uri-2>).then(() => console.assert(tick === 2, 'increment'));
```

## Response object<a name="req-response"></a>

All requests return (or resolve) to a simple instance of the Response object

```javascript
{
    status,      // HTTP status code
    statusText,  // HTTP status message
    data,        // parsed response, depends on preset content-type;
    this.headers // reponse headers object;
    this.error = false|Error; // holds error thrown by client
}
```

# xAPI requests<a name="req-xapi"></a>

`req.xapi` extends `req` for making [xAPI compliant HTTP requests](https://github.com/adlnet/xAPI-Spec/blob/master/xAPI-Communication.md#partthree)

```javascript
// step 1: globally configure LRS auth
req.xapi.LRS = '<url>';
req.xapi.AUTH = 'Basic <base64 user:name>';
req.xapi.VERSION = '<version>';

// step 2, make your request
req.xapi('/statements', options);
req.xapi('/statements', {
    promise: true
    ...req.options
});
```

Shortcut methods

```
req.xapi.get(api, config);
req.xapi.head(api, config);
req.xapi.delete(api, config);
req.xapi.post(api, data, config);
req.xapi.put(api, data, config);
```

Bulk fetch paginated statements

```
req.xapi.statements(config, options);
```

Helper methods

```
req.xapi.uuid();  // creates a RFC 4122  UUID
req.xapi.toBase64(<string>) // Base 64 encode string
```

## xAPI Request options<a name="xapi-options"></a>

```javascript
var defaults = {
    /* these options allow to overwrite the global req.XAPI config per request*/
    lrs: '',            // set LRS endpoint per request, see req.xapi.LRS
    auth: '',           // set LRS Basic auth per request, base64 encoded HTTP Auth string (<user>:<password>), see req.xapi.AUTH
    version: '',        // set xAPI version per request, , see req.xapi.VERSION
    legacy : false      // trigger alternate request syntax (IE CORS mode), see req.xapi.LEGACY, https://github.com/adlnet/xAPI-Spec/blob/master/xAPI-Communication.md#alt-request-syntax
};
```

## Global configuration<a name="xapi-config"></a>

Configure LRS

```javascript
req.xapi.LRS = <string:uri>;
req.xapi.AUTH = <string>; // base64 encoded HTTP Auth string (<user>:<password>), see req.xapi.AUTH
req.xapi.VERSION = <string:semver>; // xAPI sspec version
```

a working example config:

```javascript
    req.xapi.LRS = 'https://lrs.adlnet.gov/xAPI';
    req.xapi.AUTH = 'Basic ' + req.xapi.toBase64('tom:1234');
    req.xapi.VERSION = '1.0.2';
    req.ASYNC = true;

    req.get('/statements').then((res) => {
        console.log(res.data.statements);
    });
```

Optional set [Legacy CORS mode](https://github.com/adlnet/xAPI-Spec/blob/master/xAPI-Communication.md#alt-request-syntax)

```
req.xapi.LEGACY = true;
```
## Statement aggregation<a name="xapi-aggregation"></a>

The aggregator is a simple batch function automating [paginated statement retrieval](https://github.com/adlnet/xAPI-Spec/blob/master/xAPI-Data.md#details-21).
It accumulates statements for a specified query via multiple calls until the pagination resolves.
The result is a [response](#req-response) instance like you would get for a single statements GET query, only that `res.data.statements` holds now an array of all aggregated statements


```javascript
req.xapi.statements({
    promise: true
}).then((res) => {
    console.log(res.data.statements);
});
```

* Tip: the `options.always()` callback is called on each step and can be used to indicate the aggregation process to the user

```javascript
let length = 0;
req.xapi.statements({
    promise: true,
    always: function(res) => {
        length += res.data.statements.length;
        console.log('fetched' + length + 'statements');
    }
}).then((res) => {
    console.log('Finished: ' + res.data.statements.length + 'statements');
});
```

`cap` option:

The `cap` option can be set in order to stop and resolve the aggregation if a certain threshold of received statements is surpassed.

Note that the `cap` option only defines where to cut an aggregation. It does not define how many statements are returned.

```javascript
req.xapi.statements({
    promise: true,
    cap: 1000
}).then((res) => {
    console.log('Capped request finished: ' + res.data.statements.length + 'statements');
});
```
