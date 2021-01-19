const express = require("express");
const bodyParser = require("body-parser");
const http = require('http');

var app = express();
var port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));

http.createServer(function (req, res) {
    var html = buildHtml(req);

    res.writeHead(200, {
        'Conten-type': 'text/html',
        'Content-length': html.length,
        'Expires': new Date().toUTCString()
    });
    res.end(html);
}).listen(port);

app.post("/on", function (req, res) {
    console.log("on was pressed");
});

function buildHtml(req) {
    var header = '<meta charset="UTF-8">' +
        '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
        '<title>Homeautomation Peters</title>' +
        '<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta1/dist/css/bootstrap.min.css" rel="stylesheet"' +
        'integrity="sha384-giJF6kkoqNQ00vy+HMDP7azOuL0xtbfIcaT9wjKHr8RbDVddVHyTfAAsrekwKmP1" crossorigin="anonymous">';
    var body = '<h1>Hello World!</h1>' +
        '<form action="/on" method="post">' +
        '<button type="submit" class="btn btn-primary btn-lg m-3">On</button>' +
        '</form>' +
        '<form action="/off" method="post">' +
        '<button type="submit" class="btn btn-primary btn-lg m-3">Off</button>' +
        '</form>';

    return '<!DOCTYPE html>' +
        '<html><head>' + header + '</head><body>' + body + '</body></html>';
};
