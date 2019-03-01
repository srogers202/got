"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var url_1 = require("url");
var is_1 = require("@sindresorhus/is");
var known_hook_events_1 = require("./known-hook-events");
function merge(target) {
    var sources = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        sources[_i - 1] = arguments[_i];
    }
    for (var _a = 0, sources_1 = sources; _a < sources_1.length; _a++) {
        var source = sources_1[_a];
        var _loop_1 = function (key, sourceValue) {
            if (is_1.default.undefined(sourceValue)) {
                return "continue";
            }
            var targetValue = target[key];
            if (targetValue instanceof url_1.URLSearchParams && sourceValue instanceof url_1.URLSearchParams) {
                var params_1 = new url_1.URLSearchParams();
                var append = function (value, key) { return params_1.append(key, value); };
                targetValue.forEach(append);
                sourceValue.forEach(append);
                target[key] = params_1;
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
        };
        for (var _b = 0, _c = Object.entries(source); _b < _c.length; _b++) {
            var _d = _c[_b], key = _d[0], sourceValue = _d[1];
            _loop_1(key, sourceValue);
        }
    }
    return target;
}
exports.default = merge;
function mergeOptions() {
    var sources = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        sources[_i] = arguments[_i];
    }
    sources = sources.map(function (source) { return source || {}; });
    var merged = merge.apply(void 0, [{}].concat(sources));
    // TODO: This is a funky situation. Even though we "know" that we're going to
    //       populate the `hooks` object in the loop below, TypeScript want us to
    //       put them into the object upon initialization, because it cannot infer
    //       that they are going to conform correctly in runtime.
    // eslint-disable-next-line @typescript-eslint/no-object-literal-type-assertion
    var hooks = {};
    for (var _a = 0, knownHookEvents_1 = known_hook_events_1.default; _a < knownHookEvents_1.length; _a++) {
        var hook = knownHookEvents_1[_a];
        hooks[hook] = [];
    }
    for (var _b = 0, sources_2 = sources; _b < sources_2.length; _b++) {
        var source = sources_2[_b];
        if (source.hooks) {
            for (var _c = 0, knownHookEvents_2 = known_hook_events_1.default; _c < knownHookEvents_2.length; _c++) {
                var hook = knownHookEvents_2[_c];
                hooks[hook] = hooks[hook].concat(source.hooks[hook] || []);
            }
        }
    }
    merged.hooks = hooks;
    return merged;
}
exports.mergeOptions = mergeOptions;
function mergeInstances(instances, methods) {
    var handlers = instances.map(function (instance) { return instance.defaults.handler; });
    var size = instances.length - 1;
    return {
        methods: methods,
        options: mergeOptions.apply(void 0, instances.map(function (instance) { return instance.defaults.options; })),
        handler: function (options, next) {
            var iteration = -1;
            var iterate = function (options) { return handlers[++iteration](options, iteration === size ? next : iterate); };
            return iterate(options);
        }
    };
}
exports.mergeInstances = mergeInstances;
