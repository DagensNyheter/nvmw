var url = require('url'),
    bytes = require('./bytes'),
    fs = require('fs'),
    ESC_UP_CLL = '\x1B[1A\x1B[K'; // Up + Clear-Line

function wget(uri, callback) {
    console.log('Download file from %s', uri);
    var parsedUri = url.parse(uri);

    console.log(uri)
    var options = {
        protocol: "http:",
        host: "bf-proxy01.sth.basefarm.net",
        port: 8888,
        path: uri,
        headers: {
            Host: uri
        }
    };

    var paths = parsedUri.pathname.split('/');
    var filename = paths[paths.length - 1];
    console.log(filename);

    var http = require('http');

    var req = http.get(options, function (res) {
        if (res.statusCode === 302 || res.statusCode === 301) {
            console.log('Redirect: ' + res.headers.location);
            return wget(res.headers.location, callback);
        }
        if (res.statusCode !== 200) {
            callback(null);
            return;
        }
        var contentLength = parseInt(res.headers['content-length'], 10);
        if (isNaN(contentLength)) {
            console.warn('Can\'t get \'content-length\'');
        } else {
            console.log('Content length is %s', bytes(contentLength));
        }

        var data = [];
        var offset = 0;

        var start = Date.now();
        console.log(''); // New line for ESC_UP_CLL
        res.on('data', function (buf) {
            data.push(buf);
            offset += buf.length;
            var use = Date.now() - start;
            if (use === 0) {
              use = 1;
            }
            if (contentLength) {
                console.log(ESC_UP_CLL + 'Download %d%, %s / %s, %s/s ...',
                    offset / contentLength * 100 | 0, bytes(offset), bytes(contentLength),
                    bytes(offset / use * 1000));
            } else {
                console.log(ESC_UP_CLL + 'Download %s, %s/s ...',
                    bytes(offset),
                    bytes(offset / use * 1000));
            }
        });

        res.on('end', function () {
            console.log('Donwload done');
            callback(filename, Buffer.concat(data, offset));
        });
    });

    req.on('error', function (e) {
        console.log('Got error: ' + e.message);
    });
}

module.exports = wget;
