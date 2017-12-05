> Note. This repo is currently not licensed, as it is ALPHA and in active development. However there is nothing secret with the code. Feedback welcome.

# lxRequest

A lightwight standalone http request library. Transparent and dependency free requests via `xhr` (browser) or `http` (node).

- node or browser
- no dependencies
- use eas promises or callbacks
- small and extendable
- configurable, globally or per request
- transparent, great for testing
- presets
- [xAPI](https://github.com/adlnet/xAPI-Spec/blob/master/xAPI.md ) requests and xAPI statement aggregation

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

#Request<a name="req"></a>

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
req.json('<string:url>', <object:options>); // application/json
req.form('<string:url>', <object:options>); // application/x-www-form-urlencoded
req.plain('<string:url>', <object:options>); // text/plain
req.raw('<string:url>', <object:options>); // no content type, alias of req.request()
```

## Request Options<a name="req-options"></a>

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
## Global Config<a name="req-config"></a>

Global configuration allows you to change the behaviour for all requests

`req.ASYNC`: set callback or promise mode for all request: either '`callback`' (default) or `'promise'`

```javascript
req.ASYNC= 'promise';

req.get(<uri>).then(() => {
    alert("Look Ma, it's a promise!");
});

```

`req.Promise`: optional ES6 Promise shim/substitute

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

`req.xapi` extends `req` for making [xAPI compliant http requests](https://github.com/adlnet/xAPI-Spec/blob/master/xAPI-Communication.md#partthree)

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
## Request options<a name="xapi-options"></a>
TODO

## Global Config<a name="xapi-config"></a>
TODO

## Statement aggregation<a name="xapi-aggregation"></a>


@TODO

`xapi.LEGACY` triggers  xAPI 'CORS' mode
