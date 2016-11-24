'use strict';

const http = require('http');
const path = require('path');
// let fs = require('fs');

const server = (() => {
    return http.createServer(function(request, response) {

        // curr not used, but later we may load files
        let filePath = '.' + request.url;
        if (filePath === './') {
            filePath = './index.html';
        }

        let extname = String(path.extname(filePath)).toLowerCase();
        let name = path.basename(filePath, extname);

        let contentType = 'text/html';
        let mimeTypes = {
            '.html': 'text/html',
            '.json': 'application/json'
        };

        contentType = mimeTypes[extname] || 'application/octect-stream';
        let body = [];
        request
        .on('error', (err) => {
            response.writeHead(500);
            response.end(`Sorry, check with the site admin for error: [500] ${err.message} ..\n`);
            response.end();
        })
        .on('data', (chunk) => {
            body.push(chunk);
        })
        .on('end', () => {
            let content = Buffer.concat(body).toString();

            switch (name) {
                case '404':
                    response.writeHead(404, { 'Content-Type': contentType });
                    response.end(content, 'utf-8');
                    break;

                case '200':
                    response.writeHead(200, { 'Content-Type': contentType });
                    response.end(content, 'utf-8');
                    break;

                default:
                    response.writeHead(500);
                    response.end('Sorry, check with the site admin for error: 500 ..\n');
                    response.end();
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
