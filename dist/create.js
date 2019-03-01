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
var errors = require('./errors');
var asStream = require('./as-stream').default;
var asPromise = require('./as-promise').default;
var normalizeArguments = require('./normalize-arguments');
var _a = require('./merge'), merge = _a.default, mergeOptions = _a.mergeOptions, mergeInstances = _a.mergeInstances;
var deepFreeze = require('./utils/deep-freeze').default;
var getPromiseOrStream = function (options) { return options.stream ? asStream(options) : asPromise(options); };
var aliases = [
    'get',
    'post',
    'put',
    'patch',
    'head',
    'delete'
];
var create = function (defaults) {
    defaults = merge({}, defaults);
    normalizeArguments.preNormalize(defaults.options);
    if (!defaults.handler) {
        // This can't be getPromiseOrStream, because when merging
        // the chain would stop at this point and no further handlers would be called.
        defaults.handler = function (options, next) { return next(options); };
    }
    function got(url, options) {
        try {
            return defaults.handler(normalizeArguments(url, options, defaults), getPromiseOrStream);
        }
        catch (error) {
            if (options && options.stream) {
                throw error;
            }
            else {
                return Promise.reject(error);
            }
        }
    }
    got.create = create;
    got.extend = function (options) {
        var mutableDefaults;
        if (options && Reflect.has(options, 'mutableDefaults')) {
            mutableDefaults = options.mutableDefaults;
            delete options.mutableDefaults;
        }
        else {
            mutableDefaults = defaults.mutableDefaults;
        }
        return create({
            options: mergeOptions(defaults.options, options),
            handler: defaults.handler,
            mutableDefaults: mutableDefaults
        });
    };
    got.mergeInstances = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return create(mergeInstances(args));
    };
    got.stream = function (url, options) { return got(url, __assign({}, options, { stream: true })); };
    var _loop_1 = function (method) {
        got[method] = function (url, options) { return got(url, __assign({}, options, { method: method })); };
        got.stream[method] = function (url, options) { return got.stream(url, __assign({}, options, { method: method })); };
    };
    for (var _i = 0, aliases_1 = aliases; _i < aliases_1.length; _i++) {
        var method = aliases_1[_i];
        _loop_1(method);
    }
    Object.assign(got, __assign({}, errors, { mergeOptions: mergeOptions }));
    Object.defineProperty(got, 'defaults', {
        value: defaults.mutableDefaults ? defaults : deepFreeze(defaults),
        writable: defaults.mutableDefaults,
        configurable: defaults.mutableDefaults,
        enumerable: true
    });
    return got;
};
module.exports = create;
