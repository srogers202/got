"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const url_1 = __importDefault(require("url"));
const http_1 = __importDefault(require("http"));
const p_cancelable_1 = __importDefault(require("p-cancelable"));
const is_1 = __importDefault(require("@sindresorhus/is"));
class GotError extends Error {
    constructor(message, error, options) {
        super(message);
        Error.captureStackTrace(this, this.constructor);
        this.name = 'GotError';
        if (!is_1.default.undefined(error.code)) {
            this.code = error.code;
        }
        Object.assign(this, {
            host: options.host,
            hostname: options.hostname,
            method: options.method,
            path: options.path,
            socketPath: options.socketPath,
            protocol: options.protocol,
            url: options.href,
            gotOptions: options
        });
    }
}
exports.GotError = GotError;
class CacheError extends GotError {
    constructor(error, options) {
        super(error.message, error, options);
        this.name = 'CacheError';
    }
}
exports.CacheError = CacheError;
class RequestError extends GotError {
    constructor(error, options) {
        super(error.message, error, options);
        this.name = 'RequestError';
    }
}
exports.RequestError = RequestError;
class ReadError extends GotError {
    constructor(error, options) {
        super(error.message, error, options);
        this.name = 'ReadError';
    }
}
exports.ReadError = ReadError;
class ParseError extends GotError {
    constructor(error, statusCode, options, data) {
        super(`${error.message} in "${url_1.default.format(options)}"`, error, options);
        this.name = 'ParseError';
        this.body = data;
        this.statusCode = statusCode;
        this.statusMessage = http_1.default.STATUS_CODES[this.statusCode];
    }
}
exports.ParseError = ParseError;
class HTTPError extends GotError {
    constructor(response, options) {
        const { statusCode } = response;
        let { statusMessage } = response;
        if (statusMessage) {
            statusMessage = statusMessage.replace(/\r?\n/g, ' ').trim();
        }
        else {
            statusMessage = http_1.default.STATUS_CODES[statusCode];
        }
        super(`Response code ${statusCode} (${statusMessage})`, {}, options);
        this.name = 'HTTPError';
        this.statusCode = statusCode;
        this.statusMessage = statusMessage;
        this.headers = response.headers;
        this.body = response.body;
    }
}
exports.HTTPError = HTTPError;
class MaxRedirectsError extends GotError {
    constructor(statusCode, redirectUrls, options) {
        super('Redirected 10 times. Aborting.', {}, options);
        this.name = 'MaxRedirectsError';
        this.statusCode = statusCode;
        this.statusMessage = http_1.default.STATUS_CODES[this.statusCode];
        this.redirectUrls = redirectUrls;
    }
}
exports.MaxRedirectsError = MaxRedirectsError;
class UnsupportedProtocolError extends GotError {
    constructor(options) {
        super(`Unsupported protocol "${options.protocol}"`, {}, options);
        this.name = 'UnsupportedProtocolError';
    }
}
exports.UnsupportedProtocolError = UnsupportedProtocolError;
class TimeoutError extends GotError {
    constructor(error, timings, options) {
        super(error.message, { code: 'ETIMEDOUT' }, options);
        this.name = 'TimeoutError';
        this.event = error.event;
        this.timings = timings;
    }
}
exports.TimeoutError = TimeoutError;
exports.CancelError = p_cancelable_1.default.CancelError;
//# sourceMappingURL=errors.js.map