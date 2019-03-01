"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const zlib_1 = __importDefault(require("zlib"));
exports.default = typeof zlib_1.default.createBrotliDecompress === 'function';
//# sourceMappingURL=supports-brotli.js.map