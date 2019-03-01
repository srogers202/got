"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = __importDefault(require("events"));
const get_stream_1 = __importDefault(require("get-stream"));
const is_1 = __importDefault(require("@sindresorhus/is"));
const p_cancelable_1 = __importDefault(require("p-cancelable"));
const request_as_event_emitter_1 = __importDefault(require("./request-as-event-emitter"));
const errors_1 = require("./errors");
const merge_1 = require("./merge");
const normalize_arguments_1 = require("./normalize-arguments");
function asPromise(options) {
    const proxy = new events_1.default();
    const parseBody = (response) => {
        if (options.responseType === 'json') {
            response.body = JSON.parse(response.body);
        }
        else if (options.responseType === 'buffer') {
            response.body = Buffer.from(response.body);
        }
        else if (options.responseType !== 'text' && !is_1.default.falsy(options.responseType)) {
            throw new Error(`Failed to parse body of type '${options.responseType}'`);
        }
    };
    const promise = new p_cancelable_1.default((resolve, reject, onCancel) => {
        const emitter = request_as_event_emitter_1.default(options);
        onCancel(emitter.abort);
        emitter.on('response', (response) => __awaiter(this, void 0, void 0, function* () {
            proxy.emit('response', response);
            const stream = is_1.default.null_(options.encoding) ? get_stream_1.default.buffer(response) : get_stream_1.default(response, { encoding: options.encoding });
            let data;
            try {
                data = yield stream;
            }
            catch (error) {
                reject(new errors_1.ReadError(error, options));
                return;
            }
            const limitStatusCode = options.followRedirect ? 299 : 399;
            response.body = data;
            try {
                for (const [index, hook] of options.hooks.afterResponse.entries()) {
                    // eslint-disable-next-line no-await-in-loop
                    response = yield hook(response, updatedOptions => {
                        updatedOptions = normalize_arguments_1.reNormalize(merge_1.mergeOptions(options, Object.assign({}, updatedOptions, { retry: 0, throwHttpErrors: false })));
                        // Remove any further hooks for that request, because we we'll call them anyway.
                        // The loop continues. We don't want duplicates (asPromise recursion).
                        updatedOptions.hooks.afterResponse = options.hooks.afterResponse.slice(0, index);
                        return asPromise(updatedOptions);
                    });
                }
            }
            catch (error) {
                reject(error);
                return;
            }
            const { statusCode } = response;
            if (response.body) {
                try {
                    parseBody(response);
                }
                catch (error) {
                    if (statusCode >= 200 && statusCode < 300) {
                        const parseError = new errors_1.ParseError(error, statusCode, options, data);
                        Object.defineProperty(parseError, 'response', { value: response });
                        reject(parseError);
                        return;
                    }
                }
            }
            if (statusCode !== 304 && (statusCode < 200 || statusCode > limitStatusCode)) {
                const error = new errors_1.HTTPError(response, options);
                Object.defineProperty(error, 'response', { value: response });
                if (emitter.retry(error) === false) {
                    if (options.throwHttpErrors) {
                        reject(error);
                        return;
                    }
                    resolve(options.resolveBodyOnly ? response.body : response);
                }
                return;
            }
            resolve(options.resolveBodyOnly ? response.body : response);
        }));
        emitter.once('error', reject);
        [
            'request',
            'redirect',
            'uploadProgress',
            'downloadProgress'
        ].forEach(event => emitter.on(event, (...args) => proxy.emit(event, ...args)));
    });
    promise.on = (name, fn) => {
        proxy.on(name, fn);
        return promise;
    };
    promise.json = () => {
        options.responseType = 'json';
        options.resolveBodyOnly = true;
        return promise;
    };
    promise.buffer = () => {
        options.responseType = 'buffer';
        options.resolveBodyOnly = true;
        return promise;
    };
    promise.text = () => {
        options.responseType = 'text';
        options.resolveBodyOnly = true;
        return promise;
    };
    return promise;
}
exports.default = asPromise;
//# sourceMappingURL=as-promise.js.map