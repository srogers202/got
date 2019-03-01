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
const fs_1 = __importDefault(require("fs"));
const util_1 = require("util");
const is_1 = __importDefault(require("@sindresorhus/is"));
const is_form_data_1 = __importDefault(require("./is-form-data"));
exports.default = (options) => __awaiter(this, void 0, void 0, function* () {
    const { body } = options;
    if (options.headers['content-length']) {
        return Number(options.headers['content-length']);
    }
    if (!body && !options.stream) {
        return 0;
    }
    if (is_1.default.string(body)) {
        return Buffer.byteLength(body);
    }
    if (is_form_data_1.default(body)) {
        return util_1.promisify(body.getLength.bind(body))();
    }
    if (body instanceof fs_1.default.ReadStream) {
        const { size } = yield util_1.promisify(fs_1.default.stat)(body.path);
        return size;
    }
    return undefined;
});
//# sourceMappingURL=get-body-size.js.map