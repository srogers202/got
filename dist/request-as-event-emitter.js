'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const { URL, URLSearchParams } = require('url'); // TODO: Use the `URL` global when targeting Node.js 10
const util = require('util');
const EventEmitter = require('events');
const http = require('http');
const https = require('https');
const urlLib = require('url');
const CacheableRequest = require('cacheable-request');
const toReadableStream = require('to-readable-stream');
const is = require('@sindresorhus/is');
const timer = require('@szmarczak/http-timer');
const timedOut = require('./utils/timed-out');
const getBodySize = require('./utils/get-body-size').default;
const isFormData = require('./utils/is-form-data').default;
const getResponse = require('./get-response').default;
const progress = require('./progress');
const { CacheError, UnsupportedProtocolError, MaxRedirectsError, RequestError, TimeoutError } = require('./errors');
const urlToOptions = require('./utils/url-to-options').default;
const getMethodRedirectCodes = new Set([300, 301, 302, 303, 304, 305, 307, 308]);
const allMethodRedirectCodes = new Set([300, 303, 307, 308]);
module.exports = (options, input) => {
    const emitter = new EventEmitter();
    const redirects = [];
    let currentRequest;
    let requestUrl;
    let redirectString;
    let uploadBodySize;
    let retryCount = 0;
    let shouldAbort = false;
    const setCookie = options.cookieJar ? util.promisify(options.cookieJar.setCookie.bind(options.cookieJar)) : null;
    const getCookieString = options.cookieJar ? util.promisify(options.cookieJar.getCookieString.bind(options.cookieJar)) : null;
    const agents = is.object(options.agent) ? options.agent : null;
    const emitError = (error) => __awaiter(this, void 0, void 0, function* () {
        try {
            for (const hook of options.hooks.beforeError) {
                // eslint-disable-next-line no-await-in-loop
                error = yield hook(error);
            }
            emitter.emit('error', error);
        }
        catch (error2) {
            emitter.emit('error', error2);
        }
    });
    const get = (options) => __awaiter(this, void 0, void 0, function* () {
        const currentUrl = redirectString || requestUrl;
        if (options.protocol !== 'http:' && options.protocol !== 'https:') {
            throw new UnsupportedProtocolError(options);
        }
        decodeURI(currentUrl);
        let fn;
        if (is.function(options.request)) {
            fn = { request: options.request };
        }
        else {
            fn = options.protocol === 'https:' ? https : http;
        }
        if (agents) {
            const protocolName = options.protocol === 'https:' ? 'https' : 'http';
            options.agent = agents[protocolName] || options.agent;
        }
        /* istanbul ignore next: electron.net is broken */
        if (options.useElectronNet && process.versions.electron) {
            const r = ({ x: require })['yx'.slice(1)]; // Trick webpack
            const electron = r('electron');
            fn = electron.net || electron.remote.net;
        }
        if (options.cookieJar) {
            const cookieString = yield getCookieString(currentUrl, {});
            if (is.nonEmptyString(cookieString)) {
                options.headers.cookie = cookieString;
            }
        }
        let timings;
        const handleResponse = (response) => __awaiter(this, void 0, void 0, function* () {
            try {
                /* istanbul ignore next: fixes https://github.com/electron/electron/blob/cbb460d47628a7a146adf4419ed48550a98b2923/lib/browser/api/net.js#L59-L65 */
                if (options.useElectronNet) {
                    response = new Proxy(response, {
                        get: (target, name) => {
                            if (name === 'trailers' || name === 'rawTrailers') {
                                return [];
                            }
                            const value = target[name];
                            return is.function(value) ? value.bind(target) : value;
                        }
                    });
                }
                const { statusCode } = response;
                response.url = currentUrl;
                response.requestUrl = requestUrl;
                response.retryCount = retryCount;
                response.timings = timings;
                response.redirectUrls = redirects;
                response.request = {
                    gotOptions: options
                };
                const rawCookies = response.headers['set-cookie'];
                if (options.cookieJar && rawCookies) {
                    yield Promise.all(rawCookies.map(rawCookie => setCookie(rawCookie, response.url)));
                }
                if (options.followRedirect && 'location' in response.headers) {
                    if (allMethodRedirectCodes.has(statusCode) || (getMethodRedirectCodes.has(statusCode) && (options.method === 'GET' || options.method === 'HEAD'))) {
                        response.resume(); // We're being redirected, we don't care about the response.
                        if (statusCode === 303) {
                            // Server responded with "see other", indicating that the resource exists at another location,
                            // and the client should request it from that location via GET or HEAD.
                            options.method = 'GET';
                        }
                        if (redirects.length >= 10) {
                            throw new MaxRedirectsError(statusCode, redirects, options);
                        }
                        // Handles invalid URLs. See https://github.com/sindresorhus/got/issues/604
                        const redirectBuffer = Buffer.from(response.headers.location, 'binary').toString();
                        const redirectURL = new URL(redirectBuffer, currentUrl);
                        redirectString = redirectURL.toString();
                        redirects.push(redirectString);
                        const redirectOptions = Object.assign({}, options, { port: null }, urlToOptions(redirectURL));
                        for (const hook of options.hooks.beforeRedirect) {
                            // eslint-disable-next-line no-await-in-loop
                            yield hook(redirectOptions);
                        }
                        emitter.emit('redirect', response, redirectOptions);
                        yield get(redirectOptions);
                        return;
                    }
                }
                getResponse(response, options, emitter);
            }
            catch (error) {
                emitError(error);
            }
        });
        const handleRequest = request => {
            if (shouldAbort) {
                request.abort();
                return;
            }
            currentRequest = request;
            request.on('error', error => {
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
            const uploadComplete = () => {
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
            const cacheableRequest = new CacheableRequest(fn.request, options.cache);
            const cacheRequest = cacheableRequest(options, handleResponse);
            cacheRequest.once('error', error => {
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
    });
    emitter.retry = error => {
        let backoff;
        try {
            backoff = options.retry.retries(++retryCount, error);
        }
        catch (error2) {
            emitError(error2);
            return;
        }
        if (backoff) {
            const retry = (options) => __awaiter(this, void 0, void 0, function* () {
                try {
                    for (const hook of options.hooks.beforeRetry) {
                        // eslint-disable-next-line no-await-in-loop
                        yield hook(options, error, retryCount);
                    }
                    yield get(options);
                }
                catch (error) {
                    emitError(error);
                }
            });
            setTimeout(retry, backoff, Object.assign({}, options, { forceRefresh: true }));
            return true;
        }
        return false;
    };
    emitter.abort = () => {
        if (currentRequest) {
            currentRequest.abort();
        }
        else {
            shouldAbort = true;
        }
    };
    setImmediate(() => __awaiter(this, void 0, void 0, function* () {
        try {
            for (const hook of options.hooks.beforeRequest) {
                // eslint-disable-next-line no-await-in-loop
                yield hook(options);
            }
            // Serialize body
            const { body, headers } = options;
            const isForm = !is.nullOrUndefined(options.form);
            const isJSON = !is.nullOrUndefined(options.json);
            if (!is.nullOrUndefined(body)) {
                if (isForm || isJSON) {
                    throw new TypeError('The `body` option cannot be used with the `json` option or `form` option');
                }
                if (is.object(body) && isFormData(body)) {
                    // Special case for https://github.com/form-data/form-data
                    headers['content-type'] = headers['content-type'] || `multipart/form-data; boundary=${body.getBoundary()}`;
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
            // Convert buffer to stream to receive upload progress events (#322)
            if (is.buffer(body)) {
                options.body = toReadableStream(body);
                uploadBodySize = body.length;
            }
            else {
                uploadBodySize = yield getBodySize(options);
            }
            if (is.undefined(headers['content-length']) && is.undefined(headers['transfer-encoding'])) {
                if ((uploadBodySize > 0 || options.method === 'PUT') && !is.undefined(uploadBodySize)) {
                    headers['content-length'] = uploadBodySize;
                }
            }
            if (!options.stream && options.responseType === 'json' && is.undefined(headers.accept)) {
                options.headers.accept = 'application/json';
            }
            requestUrl = options.href || (new URL(options.path, urlLib.format(options))).toString();
            yield get(options);
        }
        catch (error) {
            emitError(error);
        }
    }));
    return emitter;
};
//# sourceMappingURL=request-as-event-emitter.js.map