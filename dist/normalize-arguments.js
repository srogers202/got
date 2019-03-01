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
var _a = require('url'), URL = _a.URL, URLSearchParams = _a.URLSearchParams; // TODO: Use the `URL` global when targeting Node.js 10
var urlLib = require('url');
var CacheableLookup = require('cacheable-lookup');
var is = require('@sindresorhus/is');
var lowercaseKeys = require('lowercase-keys');
var urlToOptions = require('./utils/url-to-options').default;
var validateSearchParams = require('./utils/validate-search-params').default;
var supportsBrotli = require('./utils/supports-brotli').default;
var merge = require('./merge').default;
var knownHookEvents = require('./known-hook-events').default;
var retryAfterStatusCodes = new Set([413, 429, 503]);
var shownDeprecation = false;
// `preNormalize` handles static options (e.g. headers).
// For example, when you create a custom instance and make a request
// with no static changes, they won't be normalized again.
//
// `normalize` operates on dynamic options - they cannot be saved.
// For example, `body` is everytime different per request.
// When it's done normalizing the new options, it performs merge()
// on the prenormalized options and the normalized ones.
var preNormalize = function (options, defaults) {
    if (is.nullOrUndefined(options.headers)) {
        options.headers = {};
    }
    else {
        options.headers = lowercaseKeys(options.headers);
    }
    if (options.baseUrl && !options.baseUrl.toString().endsWith('/')) {
        options.baseUrl += '/';
    }
    if (is.nullOrUndefined(options.hooks)) {
        options.hooks = {};
    }
    else if (!is.object(options.hooks)) {
        throw new TypeError("Parameter `hooks` must be an object, not " + is(options.hooks));
    }
    for (var _i = 0, knownHookEvents_1 = knownHookEvents; _i < knownHookEvents_1.length; _i++) {
        var event_1 = knownHookEvents_1[_i];
        if (is.nullOrUndefined(options.hooks[event_1])) {
            if (defaults) {
                options.hooks[event_1] = defaults.hooks[event_1].slice();
            }
            else {
                options.hooks[event_1] = [];
            }
        }
    }
    if (is.number(options.timeout)) {
        options.gotTimeout = { request: options.timeout };
    }
    else if (is.object(options.timeout)) {
        options.gotTimeout = options.timeout;
    }
    delete options.timeout;
    var retry = options.retry;
    options.retry = {
        retries: function () { return 0; },
        methods: new Set(),
        statusCodes: new Set(),
        errorCodes: new Set(),
        maxRetryAfter: undefined
    };
    if (is.nonEmptyObject(defaults) && retry !== false) {
        options.retry = __assign({}, defaults.retry);
    }
    if (retry !== false) {
        if (is.number(retry)) {
            options.retry.retries = retry;
        }
        else {
            options.retry = __assign({}, options.retry, retry);
        }
    }
    if (!options.retry.maxRetryAfter && options.gotTimeout) {
        options.retry.maxRetryAfter = Math.min.apply(Math, [options.gotTimeout.request, options.gotTimeout.connection].filter(function (n) { return !is.nullOrUndefined(n); }));
    }
    if (is.array(options.retry.methods)) {
        options.retry.methods = new Set(options.retry.methods.map(function (method) { return method.toUpperCase(); }));
    }
    if (is.array(options.retry.statusCodes)) {
        options.retry.statusCodes = new Set(options.retry.statusCodes);
    }
    if (is.array(options.retry.errorCodes)) {
        options.retry.errorCodes = new Set(options.retry.errorCodes);
    }
    if (options.dnsCache) {
        var cacheableLookup = new CacheableLookup({ cacheAdapter: options.dnsCache });
        options.lookup = cacheableLookup.lookup;
        delete options.dnsCache;
    }
    return options;
};
var normalize = function (url, options, defaults) {
    if (is.plainObject(url)) {
        options = __assign({}, url, options);
        url = options.url || {};
        delete options.url;
    }
    if (defaults) {
        options = merge({}, defaults.options, options ? preNormalize(options, defaults.options) : {});
    }
    else {
        options = merge({}, preNormalize(options));
    }
    if (!is.string(url) && !is.object(url)) {
        throw new TypeError("Parameter `url` must be a string or object, not " + is(url));
    }
    if (is.string(url)) {
        if (options.baseUrl) {
            if (url.startsWith('/')) {
                url = url.slice(1);
            }
        }
        else {
            url = url.replace(/^unix:/, 'http://$&');
        }
        url = urlToOptions(new URL(url, options.baseUrl));
    }
    else if (is(url) === 'URL') {
        url = urlToOptions(url);
    }
    // Override both null/undefined with default protocol
    options = merge({ path: '' }, url, { protocol: url.protocol || 'https:' }, options);
    for (var _i = 0, _a = options.hooks.init; _i < _a.length; _i++) {
        var hook = _a[_i];
        var called = hook(options);
        if (is.promise(called)) {
            throw new TypeError('The `init` hook must be a synchronous function');
        }
    }
    var baseUrl = options.baseUrl;
    Object.defineProperty(options, 'baseUrl', {
        set: function () {
            throw new Error('Failed to set baseUrl. Options are normalized already.');
        },
        get: function () { return baseUrl; }
    });
    var searchParams = options.searchParams;
    delete options.searchParams;
    if (options.query) {
        if (!shownDeprecation) {
            console.warn('`options.query` is deprecated. We support it solely for compatibility - it will be removed in Got 11. Use `options.searchParams` instead.');
            shownDeprecation = true;
        }
        searchParams = options.query;
        delete options.query;
    }
    if (is.nonEmptyString(searchParams) || is.nonEmptyObject(searchParams) || searchParams instanceof URLSearchParams) {
        if (!is.string(searchParams)) {
            if (!(searchParams instanceof URLSearchParams)) {
                validateSearchParams(searchParams);
            }
            searchParams = (new URLSearchParams(searchParams)).toString();
        }
        options.path = options.path.split('?')[0] + "?" + searchParams;
    }
    if (options.hostname === 'unix') {
        var matches = /(.+?):(.+)/.exec(options.path);
        if (matches) {
            var socketPath = matches[1], path = matches[2];
            options = __assign({}, options, { socketPath: socketPath,
                path: path, host: null });
        }
    }
    var headers = options.headers;
    for (var _b = 0, _c = Object.entries(headers); _b < _c.length; _b++) {
        var _d = _c[_b], key = _d[0], value = _d[1];
        if (is.nullOrUndefined(value)) {
            delete headers[key];
        }
    }
    if (options.decompress && is.undefined(headers['accept-encoding'])) {
        headers['accept-encoding'] = supportsBrotli ? 'gzip, deflate, br' : 'gzip, deflate';
    }
    if (options.method) {
        options.method = options.method.toUpperCase();
    }
    if (!is.function(options.retry.retries)) {
        var retries_1 = options.retry.retries;
        options.retry.retries = function (iteration, error) {
            if (iteration > retries_1) {
                return 0;
            }
            if ((!error || !options.retry.errorCodes.has(error.code)) && (!options.retry.methods.has(error.method) || !options.retry.statusCodes.has(error.statusCode))) {
                return 0;
            }
            if (Reflect.has(error, 'headers') && Reflect.has(error.headers, 'retry-after') && retryAfterStatusCodes.has(error.statusCode)) {
                var after = Number(error.headers['retry-after']);
                if (is.nan(after)) {
                    after = Date.parse(error.headers['retry-after']) - Date.now();
                }
                else {
                    after *= 1000;
                }
                if (after > options.retry.maxRetryAfter) {
                    return 0;
                }
                return after;
            }
            if (error.statusCode === 413) {
                return 0;
            }
            var noise = Math.random() * 100;
            return ((Math.pow(2, (iteration - 1))) * 1000) + noise;
        };
    }
    return options;
};
var reNormalize = function (options) { return normalize(urlLib.format(options), options); };
module.exports = normalize;
module.exports.preNormalize = preNormalize;
module.exports.reNormalize = reNormalize;
