"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var is_1 = require("@sindresorhus/is");
var verify = function (value, type) {
    if (!is_1.default.string(value) && !is_1.default.number(value) && !is_1.default.boolean(value) && !is_1.default.null_(value)) {
        throw new TypeError("The `searchParams` " + type + " '" + value + "' must be a string, number, boolean or null");
    }
};
exports.default = (function (searchParam) {
    for (var _i = 0, _a = Object.entries(searchParam); _i < _a.length; _i++) {
        var _b = _a[_i], key = _b[0], value = _b[1];
        verify(key, 'key');
        verify(value, 'value');
    }
});
