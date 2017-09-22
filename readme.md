> Note. This repo is currently not licensed, as it is ALPHA and in active development. However there is nothing secret with the code. Feedback welcome.

# lxRequest

Transparent and dependency free requests via `xhr` (browser) or `http` (node).

## Usage

### Node

```javascript

// default requests
var req = require('./req.js');

// xAPI requests
var req = require('./req.xapi.js');

```

### Browser

```
<script src="./req/req.js"></script>
<script src="./req/req.xapi.js"></script>
```

## Making requests


```javascript

// default requests
req('<url>', options);

// xAPI requests
// lrs auth
req.xapi.LRS = '<url>';
req.xapi.AUTH = 'Basic <base64 user:name>';
req.xapi.VERSION = '<version>';

req.xapi('/statements', options);

```

## Options

### req

@TODO

### req.xapi

@TODO

`xapi.LEGACY` triggers  xAPI 'CORS' mode
