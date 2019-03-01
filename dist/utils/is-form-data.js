"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var is_1 = require("@sindresorhus/is");
exports.default = (function (body) { return is_1.default.nodeStream(body) && is_1.default.function_(body.getBoundary); });
