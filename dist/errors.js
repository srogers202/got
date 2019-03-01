"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var url_1 = require("url");
var http_1 = require("http");
var p_cancelable_1 = require("p-cancelable");
var is_1 = require("@sindresorhus/is");
var GotError = /** @class */ (function (_super) {
    __extends(GotError, _super);
    function GotError(message, error, options) {
        var _this = _super.call(this, message) || this;
        Error.captureStackTrace(_this, _this.constructor);
        _this.name = 'GotError';
        if (!is_1.default.undefined(error.code)) {
            _this.code = error.code;
        }
        Object.assign(_this, {
            host: options.host,
            hostname: options.hostname,
            method: options.method,
            path: options.path,
            socketPath: options.socketPath,
            protocol: options.protocol,
            url: options.href,
            gotOptions: options
        });
        return _this;
    }
    return GotError;
}(Error));
exports.GotError = GotError;
var CacheError = /** @class */ (function (_super) {
    __extends(CacheError, _super);
    function CacheError(error, options) {
        var _this = _super.call(this, error.message, error, options) || this;
        _this.name = 'CacheError';
        return _this;
    }
    return CacheError;
}(GotError));
exports.CacheError = CacheError;
var RequestError = /** @class */ (function (_super) {
    __extends(RequestError, _super);
    function RequestError(error, options) {
        var _this = _super.call(this, error.message, error, options) || this;
        _this.name = 'RequestError';
        return _this;
    }
    return RequestError;
}(GotError));
exports.RequestError = RequestError;
var ReadError = /** @class */ (function (_super) {
    __extends(ReadError, _super);
    function ReadError(error, options) {
        var _this = _super.call(this, error.message, error, options) || this;
        _this.name = 'ReadError';
        return _this;
    }
    return ReadError;
}(GotError));
exports.ReadError = ReadError;
var ParseError = /** @class */ (function (_super) {
    __extends(ParseError, _super);
    function ParseError(error, statusCode, options, data) {
        var _this = _super.call(this, error.message + " in \"" + url_1.default.format(options) + "\"", error, options) || this;
        _this.name = 'ParseError';
        _this.body = data;
        _this.statusCode = statusCode;
        _this.statusMessage = http_1.default.STATUS_CODES[_this.statusCode];
        return _this;
    }
    return ParseError;
}(GotError));
exports.ParseError = ParseError;
var HTTPError = /** @class */ (function (_super) {
    __extends(HTTPError, _super);
    function HTTPError(response, options) {
        var _this = this;
        var statusCode = response.statusCode;
        var statusMessage = response.statusMessage;
        if (statusMessage) {
            statusMessage = statusMessage.replace(/\r?\n/g, ' ').trim();
        }
        else {
            statusMessage = http_1.default.STATUS_CODES[statusCode];
        }
        _this = _super.call(this, "Response code " + statusCode + " (" + statusMessage + ")", {}, options) || this;
        _this.name = 'HTTPError';
        _this.statusCode = statusCode;
        _this.statusMessage = statusMessage;
        _this.headers = response.headers;
        _this.body = response.body;
        return _this;
    }
    return HTTPError;
}(GotError));
exports.HTTPError = HTTPError;
var MaxRedirectsError = /** @class */ (function (_super) {
    __extends(MaxRedirectsError, _super);
    function MaxRedirectsError(statusCode, redirectUrls, options) {
        var _this = _super.call(this, 'Redirected 10 times. Aborting.', {}, options) || this;
        _this.name = 'MaxRedirectsError';
        _this.statusCode = statusCode;
        _this.statusMessage = http_1.default.STATUS_CODES[_this.statusCode];
        _this.redirectUrls = redirectUrls;
        return _this;
    }
    return MaxRedirectsError;
}(GotError));
exports.MaxRedirectsError = MaxRedirectsError;
var UnsupportedProtocolError = /** @class */ (function (_super) {
    __extends(UnsupportedProtocolError, _super);
    function UnsupportedProtocolError(options) {
        var _this = _super.call(this, "Unsupported protocol \"" + options.protocol + "\"", {}, options) || this;
        _this.name = 'UnsupportedProtocolError';
        return _this;
    }
    return UnsupportedProtocolError;
}(GotError));
exports.UnsupportedProtocolError = UnsupportedProtocolError;
var TimeoutError = /** @class */ (function (_super) {
    __extends(TimeoutError, _super);
    function TimeoutError(error, timings, options) {
        var _this = _super.call(this, error.message, { code: 'ETIMEDOUT' }, options) || this;
        _this.name = 'TimeoutError';
        _this.event = error.event;
        _this.timings = timings;
        return _this;
    }
    return TimeoutError;
}(GotError));
exports.TimeoutError = TimeoutError;
exports.CancelError = p_cancelable_1.default.CancelError;
