"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
var events_1 = require("events");
var get_stream_1 = require("get-stream");
var is_1 = require("@sindresorhus/is");
var p_cancelable_1 = require("p-cancelable");
var request_as_event_emitter_1 = require("./request-as-event-emitter");
var errors_1 = require("./errors");
var merge_1 = require("./merge");
var normalize_arguments_1 = require("./normalize-arguments");
function asPromise(options) {
    var _this = this;
    var proxy = new events_1.default();
    var parseBody = function (response) {
        if (options.responseType === 'json') {
            response.body = JSON.parse(response.body);
        }
        else if (options.responseType === 'buffer') {
            response.body = Buffer.from(response.body);
        }
        else if (options.responseType !== 'text' && !is_1.default.falsy(options.responseType)) {
            throw new Error("Failed to parse body of type '" + options.responseType + "'");
        }
    };
    var promise = new p_cancelable_1.default(function (resolve, reject, onCancel) {
        var emitter = request_as_event_emitter_1.default(options);
        onCancel(emitter.abort);
        emitter.on('response', function (response) { return __awaiter(_this, void 0, void 0, function () {
            var stream, data, error_1, limitStatusCode, _loop_1, _i, _a, _b, index, hook, error_2, statusCode, parseError, error;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        proxy.emit('response', response);
                        stream = is_1.default.null_(options.encoding) ? get_stream_1.default.buffer(response) : get_stream_1.default(response, { encoding: options.encoding });
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, stream];
                    case 2:
                        data = _c.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _c.sent();
                        reject(new errors_1.ReadError(error_1, options));
                        return [2 /*return*/];
                    case 4:
                        limitStatusCode = options.followRedirect ? 299 : 399;
                        response.body = data;
                        _c.label = 5;
                    case 5:
                        _c.trys.push([5, 10, , 11]);
                        _loop_1 = function (index, hook) {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, hook(response, function (updatedOptions) {
                                            updatedOptions = normalize_arguments_1.reNormalize(merge_1.mergeOptions(options, __assign({}, updatedOptions, { retry: 0, throwHttpErrors: false })));
                                            // Remove any further hooks for that request, because we we'll call them anyway.
                                            // The loop continues. We don't want duplicates (asPromise recursion).
                                            updatedOptions.hooks.afterResponse = options.hooks.afterResponse.slice(0, index);
                                            return asPromise(updatedOptions);
                                        })];
                                    case 1:
                                        // eslint-disable-next-line no-await-in-loop
                                        response = _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        };
                        _i = 0, _a = options.hooks.afterResponse.entries();
                        _c.label = 6;
                    case 6:
                        if (!(_i < _a.length)) return [3 /*break*/, 9];
                        _b = _a[_i], index = _b[0], hook = _b[1];
                        return [5 /*yield**/, _loop_1(index, hook)];
                    case 7:
                        _c.sent();
                        _c.label = 8;
                    case 8:
                        _i++;
                        return [3 /*break*/, 6];
                    case 9: return [3 /*break*/, 11];
                    case 10:
                        error_2 = _c.sent();
                        reject(error_2);
                        return [2 /*return*/];
                    case 11:
                        statusCode = response.statusCode;
                        if (response.body) {
                            try {
                                parseBody(response);
                            }
                            catch (error) {
                                if (statusCode >= 200 && statusCode < 300) {
                                    parseError = new errors_1.ParseError(error, statusCode, options, data);
                                    Object.defineProperty(parseError, 'response', { value: response });
                                    reject(parseError);
                                    return [2 /*return*/];
                                }
                            }
                        }
                        if (statusCode !== 304 && (statusCode < 200 || statusCode > limitStatusCode)) {
                            error = new errors_1.HTTPError(response, options);
                            Object.defineProperty(error, 'response', { value: response });
                            if (emitter.retry(error) === false) {
                                if (options.throwHttpErrors) {
                                    reject(error);
                                    return [2 /*return*/];
                                }
                                resolve(options.resolveBodyOnly ? response.body : response);
                            }
                            return [2 /*return*/];
                        }
                        resolve(options.resolveBodyOnly ? response.body : response);
                        return [2 /*return*/];
                }
            });
        }); });
        emitter.once('error', reject);
        [
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
    });
    promise.on = function (name, fn) {
        proxy.on(name, fn);
        return promise;
    };
    promise.json = function () {
        options.responseType = 'json';
        options.resolveBodyOnly = true;
        return promise;
    };
    promise.buffer = function () {
        options.responseType = 'buffer';
        options.resolveBodyOnly = true;
        return promise;
    };
    promise.text = function () {
        options.responseType = 'text';
        options.resolveBodyOnly = true;
        return promise;
    };
    return promise;
}
exports.default = asPromise;
