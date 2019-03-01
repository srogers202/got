"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const stream_1 = require("stream");
const duplexer3_1 = __importDefault(require("duplexer3"));
const request_as_event_emitter_1 = __importDefault(require("./request-as-event-emitter"));
const errors_1 = require("./errors");
function asStream(options) {
    const input = new stream_1.PassThrough();
    const output = new stream_1.PassThrough();
    const proxy = duplexer3_1.default(input, output);
    const piped = new Set();
    let isFinished = false;
    options.retry.retries = () => 0;
    if (options.body) {
        proxy.write = () => {
            throw new Error('Got\'s stream is not writable when the `body` option is used');
        };
    }
    const emitter = request_as_event_emitter_1.default(options, input);
    // Cancels the request
    proxy._destroy = emitter.abort;
    emitter.on('response', (response) => {
        const { statusCode } = response;
        response.on('error', error => {
            proxy.emit('error', new errors_1.ReadError(error, options));
        });
        if (options.throwHttpErrors && statusCode !== 304 && (statusCode < 200 || statusCode > 299)) {
            proxy.emit('error', new errors_1.HTTPError(response, options), null, response);
            return;
        }
        isFinished = true;
        response.pipe(output);
        for (const destination of piped) {
            if (destination.headersSent) {
                continue;
            }
            for (const [key, value] of Object.entries(response.headers)) {
                // Got gives *decompressed* data. Overriding `content-encoding` header would result in an error.
                // It's not possible to decompress already decompressed data, is it?
                const allowed = options.decompress ? key !== 'content-encoding' : true;
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
    ].forEach(event => emitter.on(event, (...args) => proxy.emit(event, ...args)));
    const pipe = proxy.pipe.bind(proxy);
    const unpipe = proxy.unpipe.bind(proxy);
    proxy.pipe = (destination, options) => {
        if (isFinished) {
            throw new Error('Failed to pipe. The response has been emitted already.');
        }
        pipe(destination, options);
        if (Reflect.has(destination, 'setHeader')) {
            piped.add(destination);
        }
        return destination;
    };
    proxy.unpipe = stream => {
        piped.delete(stream);
        return unpipe(stream);
    };
    return proxy;
}
exports.default = asStream;
//# sourceMappingURL=as-stream.js.map