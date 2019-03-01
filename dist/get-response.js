"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var is_1 = require("@sindresorhus/is");
var progress_1 = require("./progress");
var decompressResponse = require('decompress-response');
var mimicResponse = require('mimic-response');
exports.default = (function (response, options, emitter) {
    var downloadBodySize = Number(response.headers['content-length']) || undefined;
    var progressStream = progress_1.download(response, emitter, downloadBodySize);
    mimicResponse(response, progressStream);
    var newResponse = options.decompress === true &&
        is_1.default.function_(decompressResponse) &&
        options.method !== 'HEAD' ? decompressResponse(progressStream) : progressStream;
    if (!options.decompress && ['gzip', 'deflate', 'br'].includes(response.headers['content-encoding'] || '')) {
        options.encoding = null;
    }
    emitter.emit('response', newResponse);
    emitter.emit('downloadProgress', {
        percent: 0,
        transferred: 0,
        total: downloadBodySize
    });
    response.pipe(progressStream);
});
