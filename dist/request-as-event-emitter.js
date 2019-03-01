'use strict';
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
var _a = require('url'), URL = _a.URL, URLSearchParams = _a.URLSearchParams; // TODO: Use the `URL` global when targeting Node.js 10
var util = require('util');
var EventEmitter = require('events');
var http = require('http');
var https = require('https');
var urlLib = require('url');
var CacheableRequest = require('cacheable-request');
var toReadableStream = require('to-readable-stream');
var is = require('@sindresorhus/is');
var timer = require('@szmarczak/http-timer');
var timedOut = require('./utils/timed-out');
var getBodySize = require('./utils/get-body-size').default;
var isFormData = require('./utils/is-form-data').default;
var getResponse = require('./get-response').default;
var progress = require('./progress');
var _b = require('./errors'), CacheError = _b.CacheError, UnsupportedProtocolError = _b.UnsupportedProtocolError, MaxRedirectsError = _b.MaxRedirectsError, RequestError = _b.RequestError, TimeoutError = _b.TimeoutError;
var urlToOptions = require('./utils/url-to-options').default;
var getMethodRedirectCodes = new Set([300, 301, 302, 303, 304, 305, 307, 308]);
var allMethodRedirectCodes = new Set([300, 303, 307, 308]);
module.exports = function (options, input) {
    var emitter = new EventEmitter();
    var redirects = [];
    var currentRequest;
    var requestUrl;
    var redirectString;
    var uploadBodySize;
    var retryCount = 0;
    var shouldAbort = false;
    var setCookie = options.cookieJar ? util.promisify(options.cookieJar.setCookie.bind(options.cookieJar)) : null;
    var getCookieString = options.cookieJar ? util.promisify(options.cookieJar.getCookieString.bind(options.cookieJar)) : null;
    var agents = is.object(options.agent) ? options.agent : null;
    var emitError = function (error) { return __awaiter(_this, void 0, void 0, function () {
        var _i, _a, hook, error2_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 5, , 6]);
                    _i = 0, _a = options.hooks.beforeError;
                    _b.label = 1;
                case 1:
                    if (!(_i < _a.length)) return [3 /*break*/, 4];
                    hook = _a[_i];
                    return [4 /*yield*/, hook(error)];
                case 2:
                    // eslint-disable-next-line no-await-in-loop
                    error = _b.sent();
                    _b.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    emitter.emit('error', error);
                    return [3 /*break*/, 6];
                case 5:
                    error2_1 = _b.sent();
                    emitter.emit('error', error2_1);
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    var get = function (options) { return __awaiter(_this, void 0, void 0, function () {
        var currentUrl, fn, protocolName, r, electron, cookieString, timings, handleResponse, handleRequest, cacheableRequest, cacheRequest;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    currentUrl = redirectString || requestUrl;
                    if (options.protocol !== 'http:' && options.protocol !== 'https:') {
                        throw new UnsupportedProtocolError(options);
                    }
                    decodeURI(currentUrl);
                    if (is.function(options.request)) {
                        fn = { request: options.request };
                    }
                    else {
                        fn = options.protocol === 'https:' ? https : http;
                    }
                    if (agents) {
                        protocolName = options.protocol === 'https:' ? 'https' : 'http';
                        options.agent = agents[protocolName] || options.agent;
                    }
                    /* istanbul ignore next: electron.net is broken */
                    if (options.useElectronNet && process.versions.electron) {
                        r = ({ x: require })['yx'.slice(1)];
                        electron = r('electron');
                        fn = electron.net || electron.remote.net;
                    }
                    if (!options.cookieJar) return [3 /*break*/, 2];
                    return [4 /*yield*/, getCookieString(currentUrl, {})];
                case 1:
                    cookieString = _a.sent();
                    if (is.nonEmptyString(cookieString)) {
                        options.headers.cookie = cookieString;
                    }
                    _a.label = 2;
                case 2:
                    handleResponse = function (response) { return __awaiter(_this, void 0, void 0, function () {
                        var statusCode, rawCookies, redirectBuffer, redirectURL, redirectOptions, _i, _a, hook, error_1;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _b.trys.push([0, 9, , 10]);
                                    /* istanbul ignore next: fixes https://github.com/electron/electron/blob/cbb460d47628a7a146adf4419ed48550a98b2923/lib/browser/api/net.js#L59-L65 */
                                    if (options.useElectronNet) {
                                        response = new Proxy(response, {
                                            get: function (target, name) {
                                                if (name === 'trailers' || name === 'rawTrailers') {
                                                    return [];
                                                }
                                                var value = target[name];
                                                return is.function(value) ? value.bind(target) : value;
                                            }
                                        });
                                    }
                                    statusCode = response.statusCode;
                                    response.url = currentUrl;
                                    response.requestUrl = requestUrl;
                                    response.retryCount = retryCount;
                                    response.timings = timings;
                                    response.redirectUrls = redirects;
                                    response.request = {
                                        gotOptions: options
                                    };
                                    rawCookies = response.headers['set-cookie'];
                                    if (!(options.cookieJar && rawCookies)) return [3 /*break*/, 2];
                                    return [4 /*yield*/, Promise.all(rawCookies.map(function (rawCookie) { return setCookie(rawCookie, response.url); }))];
                                case 1:
                                    _b.sent();
                                    _b.label = 2;
                                case 2:
                                    if (!(options.followRedirect && 'location' in response.headers)) return [3 /*break*/, 8];
                                    if (!(allMethodRedirectCodes.has(statusCode) || (getMethodRedirectCodes.has(statusCode) && (options.method === 'GET' || options.method === 'HEAD')))) return [3 /*break*/, 8];
                                    response.resume(); // We're being redirected, we don't care about the response.
                                    if (statusCode === 303) {
                                        // Server responded with "see other", indicating that the resource exists at another location,
                                        // and the client should request it from that location via GET or HEAD.
                                        options.method = 'GET';
                                    }
                                    if (redirects.length >= 10) {
                                        throw new MaxRedirectsError(statusCode, redirects, options);
                                    }
                                    redirectBuffer = Buffer.from(response.headers.location, 'binary').toString();
                                    redirectURL = new URL(redirectBuffer, currentUrl);
                                    redirectString = redirectURL.toString();
                                    redirects.push(redirectString);
                                    redirectOptions = __assign({}, options, { port: null }, urlToOptions(redirectURL));
                                    _i = 0, _a = options.hooks.beforeRedirect;
                                    _b.label = 3;
                                case 3:
                                    if (!(_i < _a.length)) return [3 /*break*/, 6];
                                    hook = _a[_i];
                                    // eslint-disable-next-line no-await-in-loop
                                    return [4 /*yield*/, hook(redirectOptions)];
                                case 4:
                                    // eslint-disable-next-line no-await-in-loop
                                    _b.sent();
                                    _b.label = 5;
                                case 5:
                                    _i++;
                                    return [3 /*break*/, 3];
                                case 6:
                                    emitter.emit('redirect', response, redirectOptions);
                                    return [4 /*yield*/, get(redirectOptions)];
                                case 7:
                                    _b.sent();
                                    return [2 /*return*/];
                                case 8:
                                    getResponse(response, options, emitter);
                                    return [3 /*break*/, 10];
                                case 9:
                                    error_1 = _b.sent();
                                    emitError(error_1);
                                    return [3 /*break*/, 10];
                                case 10: return [2 /*return*/];
                            }
                        });
                    }); };
                    handleRequest = function (request) {
                        if (shouldAbort) {
                            request.abort();
                            return;
                        }
                        currentRequest = request;
                        request.on('error', function (error) {
                            if (request.aborted || error.message === 'socket hang up') {
                                return;
                            }
                            if (error instanceof timedOut.TimeoutError) {
                                error = new TimeoutError(error, timings, options);
                            }
                            else {
                                error = new RequestError(error, options);
                            }
                            if (emitter.retry(error) === false) {
                                emitError(error);
                            }
                        });
                        timings = timer(request);
                        progress.upload(request, emitter, uploadBodySize);
                        if (options.gotTimeout) {
                            timedOut.default(request, options.gotTimeout, options);
                        }
                        emitter.emit('request', request);
                        var uploadComplete = function () {
                            request.emit('upload-complete');
                        };
                        try {
                            if (is.nodeStream(options.body)) {
                                options.body.once('end', uploadComplete);
                                options.body.pipe(request);
                                options.body = undefined;
                            }
                            else if (options.body) {
                                request.end(options.body, uploadComplete);
                            }
                            else if (input && (options.method === 'POST' || options.method === 'PUT' || options.method === 'PATCH')) {
                                input.once('end', uploadComplete);
                                input.pipe(request);
                            }
                            else {
                                request.end(uploadComplete);
                            }
                        }
                        catch (error) {
                            emitError(new RequestError(error, options));
                        }
                    };
                    if (options.cache) {
                        cacheableRequest = new CacheableRequest(fn.request, options.cache);
                        cacheRequest = cacheableRequest(options, handleResponse);
                        cacheRequest.once('error', function (error) {
                            if (error instanceof CacheableRequest.RequestError) {
                                emitError(new RequestError(error, options));
                            }
                            else {
                                emitError(new CacheError(error, options));
                            }
                        });
                        cacheRequest.once('request', handleRequest);
                    }
                    else {
                        // Catches errors thrown by calling fn.request(...)
                        try {
                            handleRequest(fn.request(options, handleResponse));
                        }
                        catch (error) {
                            emitError(new RequestError(error, options));
                        }
                    }
                    return [2 /*return*/];
            }
        });
    }); };
    emitter.retry = function (error) {
        var backoff;
        try {
            backoff = options.retry.retries(++retryCount, error);
        }
        catch (error2) {
            emitError(error2);
            return;
        }
        if (backoff) {
            var retry = function (options) { return __awaiter(_this, void 0, void 0, function () {
                var _i, _a, hook, error_2;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _b.trys.push([0, 6, , 7]);
                            _i = 0, _a = options.hooks.beforeRetry;
                            _b.label = 1;
                        case 1:
                            if (!(_i < _a.length)) return [3 /*break*/, 4];
                            hook = _a[_i];
                            // eslint-disable-next-line no-await-in-loop
                            return [4 /*yield*/, hook(options, error, retryCount)];
                        case 2:
                            // eslint-disable-next-line no-await-in-loop
                            _b.sent();
                            _b.label = 3;
                        case 3:
                            _i++;
                            return [3 /*break*/, 1];
                        case 4: return [4 /*yield*/, get(options)];
                        case 5:
                            _b.sent();
                            return [3 /*break*/, 7];
                        case 6:
                            error_2 = _b.sent();
                            emitError(error_2);
                            return [3 /*break*/, 7];
                        case 7: return [2 /*return*/];
                    }
                });
            }); };
            setTimeout(retry, backoff, __assign({}, options, { forceRefresh: true }));
            return true;
        }
        return false;
    };
    emitter.abort = function () {
        if (currentRequest) {
            currentRequest.abort();
        }
        else {
            shouldAbort = true;
        }
    };
    setImmediate(function () { return __awaiter(_this, void 0, void 0, function () {
        var _i, _a, hook, body, headers, isForm, isJSON, error_3;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 9, , 10]);
                    _i = 0, _a = options.hooks.beforeRequest;
                    _b.label = 1;
                case 1:
                    if (!(_i < _a.length)) return [3 /*break*/, 4];
                    hook = _a[_i];
                    // eslint-disable-next-line no-await-in-loop
                    return [4 /*yield*/, hook(options)];
                case 2:
                    // eslint-disable-next-line no-await-in-loop
                    _b.sent();
                    _b.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    body = options.body, headers = options.headers;
                    isForm = !is.nullOrUndefined(options.form);
                    isJSON = !is.nullOrUndefined(options.json);
                    if (!is.nullOrUndefined(body)) {
                        if (isForm || isJSON) {
                            throw new TypeError('The `body` option cannot be used with the `json` option or `form` option');
                        }
                        if (is.object(body) && isFormData(body)) {
                            // Special case for https://github.com/form-data/form-data
                            headers['content-type'] = headers['content-type'] || "multipart/form-data; boundary=" + body.getBoundary();
                        }
                        else if (!is.nodeStream(body) && !is.string(body) && !is.buffer(body)) {
                            throw new TypeError('The `body` option must be a stream.Readable, string, Buffer, Object or Array');
                        }
                    }
                    else if (isForm) {
                        if (!is.object(options.form)) {
                            throw new TypeError('The `form` option must be an Object');
                        }
                        headers['content-type'] = headers['content-type'] || 'application/x-www-form-urlencoded';
                        options.body = (new URLSearchParams(options.form)).toString();
                    }
                    else if (isJSON) {
                        headers['content-type'] = headers['content-type'] || 'application/json';
                        options.body = JSON.stringify(options.json);
                    }
                    if (!options.method) {
                        options.method = is.nullOrUndefined(options.body) ? 'GET' : 'POST';
                    }
                    if (!is.buffer(body)) return [3 /*break*/, 5];
                    options.body = toReadableStream(body);
                    uploadBodySize = body.length;
                    return [3 /*break*/, 7];
                case 5: return [4 /*yield*/, getBodySize(options)];
                case 6:
                    uploadBodySize = _b.sent();
                    _b.label = 7;
                case 7:
                    if (is.undefined(headers['content-length']) && is.undefined(headers['transfer-encoding'])) {
                        if ((uploadBodySize > 0 || options.method === 'PUT') && !is.undefined(uploadBodySize)) {
                            headers['content-length'] = uploadBodySize;
                        }
                    }
                    if (!options.stream && options.responseType === 'json' && is.undefined(headers.accept)) {
                        options.headers.accept = 'application/json';
                    }
                    requestUrl = options.href || (new URL(options.path, urlLib.format(options))).toString();
                    return [4 /*yield*/, get(options)];
                case 8:
                    _b.sent();
                    return [3 /*break*/, 10];
                case 9:
                    error_3 = _b.sent();
                    emitError(error_3);
                    return [3 /*break*/, 10];
                case 10: return [2 /*return*/];
            }
        });
    }); });
    return emitter;
};
