"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var stream_1 = require("stream");
var duplexer3_1 = require("duplexer3");
var request_as_event_emitter_1 = require("./request-as-event-emitter");
var errors_1 = require("./errors");
function asStream(options) {
    var input = new stream_1.PassThrough();
    var output = new stream_1.PassThrough();
    var proxy = duplexer3_1.default(input, output);
    var piped = new Set();
    var isFinished = false;
    options.retry.retries = function () { return 0; };
    if (options.body) {
        proxy.write = function () {
            throw new Error('Got\'s stream is not writable when the `body` option is used');
        };
    }
    var emitter = request_as_event_emitter_1.default(options, input);
    // Cancels the request
    proxy._destroy = emitter.abort;
    emitter.on('response', function (response) {
        var statusCode = response.statusCode;
        response.on('error', function (error) {
            proxy.emit('error', new errors_1.ReadError(error, options));
        });
        if (options.throwHttpErrors && statusCode !== 304 && (statusCode < 200 || statusCode > 299)) {
            proxy.emit('error', new errors_1.HTTPError(response, options), null, response);
            return;
        }
        isFinished = true;
        response.pipe(output);
        for (var _i = 0, piped_1 = piped; _i < piped_1.length; _i++) {
            var destination = piped_1[_i];
            if (destination.headersSent) {
                continue;
            }
            for (var _a = 0, _b = Object.entries(response.headers); _a < _b.length; _a++) {
                var _c = _b[_a], key = _c[0], value = _c[1];
                // Got gives *decompressed* data. Overriding `content-encoding` header would result in an error.
                // It's not possible to decompress already decompressed data, is it?
                var allowed = options.decompress ? key !== 'content-encoding' : true;
                if (allowed) {
                    destination.setHeader(key, value);
                }
            }
            destination.statusCode = response.statusCode;
        }
        proxy.emit('response', response);
    });
    [
        'error',
        'request',
        'redirect',
        'uploadProgress',
        'downloadProgress'
    ].forEach(function (event) { return emitter.on(event, function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return proxy.emit.apply(proxy, [event].concat(args));
    }); });
    var pipe = proxy.pipe.bind(proxy);
    var unpipe = proxy.unpipe.bind(proxy);
    proxy.pipe = function (destination, options) {
        if (isFinished) {
            throw new Error('Failed to pipe. The response has been emitted already.');
        }
        pipe(destination, options);
        if (Reflect.has(destination, 'setHeader')) {
            piped.add(destination);
        }
        return destination;
    };
    proxy.unpipe = function (stream) {
        piped.delete(stream);
        return unpipe(stream);
    };
    return proxy;
}
exports.default = asStream;
