"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const is_1 = __importDefault(require("@sindresorhus/is"));
const verify = (value, type) => {
    if (!is_1.default.string(value) && !is_1.default.number(value) && !is_1.default.boolean(value) && !is_1.default.null_(value)) {
        throw new TypeError(`The \`searchParams\` ${type} '${value}' must be a string, number, boolean or null`);
    }
};
exports.default = (searchParam) => {
    for (const [key, value] of Object.entries(searchParam)) {
        verify(key, 'key');
        verify(value, 'value');
    }
};
//# sourceMappingURL=validate-search-params.js.map