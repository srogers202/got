"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var is_1 = require("@sindresorhus/is");
function deepFreeze(object) {
    for (var _i = 0, _a = Object.values(object); _i < _a.length; _i++) {
        var value = _a[_i];
        if (is_1.default.plainObject(value) || is_1.default.array(value)) {
            deepFreeze(value);
        }
    }
    return Object.freeze(object);
}
exports.default = deepFreeze;
