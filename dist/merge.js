"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const url_1 = require("url");
const is_1 = __importDefault(require("@sindresorhus/is"));
const known_hook_events_1 = __importDefault(require("./known-hook-events"));
function merge(target, ...sources) {
    for (const source of sources) {
        for (const [key, sourceValue] of Object.entries(source)) {
            if (is_1.default.undefined(sourceValue)) {
                continue;
            }
            const targetValue = target[key];
            if (targetValue instanceof url_1.URLSearchParams && sourceValue instanceof url_1.URLSearchParams) {
                const params = new url_1.URLSearchParams();
                const append = (value, key) => params.append(key, value);
                targetValue.forEach(append);
                sourceValue.forEach(append);
                target[key] = params;
            }
            else if (is_1.default.urlInstance(targetValue) && (is_1.default.urlInstance(sourceValue) || is_1.default.string(sourceValue))) {
                target[key] = new url_1.URL(sourceValue, targetValue);
            }
            else if (is_1.default.plainObject(sourceValue)) {
                if (is_1.default.plainObject(targetValue)) {
                    target[key] = merge({}, targetValue, sourceValue);
                }
                else {
                    target[key] = merge({}, sourceValue);
                }
            }
            else if (is_1.default.array(sourceValue)) {
                target[key] = merge([], sourceValue);
            }
            else {
                target[key] = sourceValue;
            }
        }
    }
    return target;
}
exports.default = merge;
function mergeOptions(...sources) {
    sources = sources.map(source => source || {});
    const merged = merge({}, ...sources);
    // TODO: This is a funky situation. Even though we "know" that we're going to
    //       populate the `hooks` object in the loop below, TypeScript want us to
    //       put them into the object upon initialization, because it cannot infer
    //       that they are going to conform correctly in runtime.
    // eslint-disable-next-line @typescript-eslint/no-object-literal-type-assertion
    const hooks = {};
    for (const hook of known_hook_events_1.default) {
        hooks[hook] = [];
    }
    for (const source of sources) {
        if (source.hooks) {
            for (const hook of known_hook_events_1.default) {
                hooks[hook] = hooks[hook].concat(source.hooks[hook] || []);
            }
        }
    }
    merged.hooks = hooks;
    return merged;
}
exports.mergeOptions = mergeOptions;
function mergeInstances(instances, methods) {
    const handlers = instances.map(instance => instance.defaults.handler);
    const size = instances.length - 1;
    return {
        methods,
        options: mergeOptions(...instances.map(instance => instance.defaults.options)),
        handler: (options, next) => {
            let iteration = -1;
            const iterate = (options) => handlers[++iteration](options, iteration === size ? next : iterate);
            return iterate(options);
        }
    };
}
exports.mergeInstances = mergeInstances;
//# sourceMappingURL=merge.js.map