"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var stream_1 = require("stream");
function download(_response, emitter, downloadBodySize) {
    var downloaded = 0;
    return new stream_1.Transform({
        transform: function (chunk, _encoding, callback) {
            downloaded += chunk.length;
            var percent = downloadBodySize ? downloaded / downloadBodySize : 0;
            // Let `flush()` be responsible for emitting the last event
            if (percent < 1) {
                emitter.emit('downloadProgress', {
                    percent: percent,
                    transferred: downloaded,
                    total: downloadBodySize
                });
            }
            callback(undefined, chunk);
        },
        flush: function (callback) {
            emitter.emit('downloadProgress', {
                percent: 1,
                transferred: downloaded,
                total: downloadBodySize
            });
            callback();
        }
    });
}
exports.download = download;
function upload(request, emitter, uploadBodySize) {
    var uploadEventFrequency = 150;
    var uploaded = 0;
    var progressInterval;
    emitter.emit('uploadProgress', {
        percent: 0,
        transferred: 0,
        total: uploadBodySize
    });
    request.once('error', function () {
        clearInterval(progressInterval);
    });
    request.once('response', function () {
        clearInterval(progressInterval);
        emitter.emit('uploadProgress', {
            percent: 1,
            transferred: uploaded,
            total: uploadBodySize
        });
    });
    request.once('socket', function (socket) {
        var onSocketConnect = function () {
            progressInterval = setInterval(function () {
                var lastUploaded = uploaded;
                /* istanbul ignore next: see #490 (occurs randomly!) */
                var headersSize = request._header ? Buffer.byteLength(request._header) : 0;
                uploaded = socket.bytesWritten - headersSize;
                // Don't emit events with unchanged progress and
                // prevent last event from being emitted, because
                // it's emitted when `response` is emitted
                if (uploaded === lastUploaded || uploaded === uploadBodySize) {
                    return;
                }
                emitter.emit('uploadProgress', {
                    percent: uploadBodySize ? uploaded / uploadBodySize : 0,
                    transferred: uploaded,
                    total: uploadBodySize
                });
            }, uploadEventFrequency);
        };
        /* istanbul ignore next: hard to test */
        if (socket.connecting) {
            socket.once('connect', onSocketConnect);
        }
        else if (socket.writable) {
            // The socket is being reused from pool,
            // so the connect event will not be emitted
            onSocketConnect();
        }
    });
}
exports.upload = upload;
