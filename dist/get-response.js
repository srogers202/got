"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const is_1 = __importDefault(require("@sindresorhus/is"));
const progress_1 = require("./progress");
const decompressResponse = require('decompress-response');
const mimicResponse = require('mimic-response');
exports.default = (response, options, emitter) => {
    const downloadBodySize = Number(response.headers['content-length']) || undefined;
    const progressStream = progress_1.download(response, emitter, downloadBodySize);
    mimicResponse(response, progressStream);
    const newResponse = options.decompress === true &&
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
};
//# sourceMappingURL=get-response.js.map