'use strict';

const http = require('http');
const path = require('path');
const Url = require('url');
// let fs = require('fs');

const server = (() => {
    return http.createServer(function(request, response) {

        let url = Url.parse(request.url);
        let extname = path.extname(url.pathname).toLowerCase();
        let name = path.basename(url.pathname, extname);

        let mimeTypes = {
            '.html': 'text/html',
            '.json': 'application/json'
        };

        let contentType = mimeTypes[extname] || 'text/plain';
        let body = '';

        response.setHeader('content-type', contentType);
        // include some request data into response
        response.setHeader('x-req-content-type', request.headers['content-type'] || '');
        response.setHeader('x-req-search', url.search);
        response.setHeader('x-req-method', request.method);
        response.setHeader('x-req-content-length', request.headers['content-length'] || '');

        request.on('error', (err) => {
            response.writeHead(500);
            response.end(`Sorry, error: [500] ${err.message} ..\n`);
            response.end();
        });

        request.on('data', (chunk) => {
            switch (request.method) {
                case 'POST':
                case 'PUT':
                case 'PATCH':
                    body += chunk.toString();
                    break;
            }
        });

        request.on('end', () => {
            switch (name) {
                case '404':
                    response.statusCode = 404;
                    response.end(body, 'utf-8');
                    break;
                case '200':
                    response.statusCode = 200;
                    response.end(body, 'utf-8');
                    break;
                case '204':
                    response.statusCode = 204;
                    response.end('', 'utf-8');
                    break;
                case '400':
                    response.statusCode = 400;
                    response.end('body', 'utf-8');
                    break;
                default:
                    response.statusCode = 500;
                    response.end('Sorry, error: 500 ..\n');
                    response.end('body', 'utf-8');
            }

        });

    });

})();

let listen = (port) => {
    let url = `http://localhost:${port}`;
    server.listen(port);
    console.log(`Server running at ${url}`);
    return url;
};

let close = () => {
    server.close();
};

module.exports = {
    listen: listen,
    close: close
};
