"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var is_1 = require("@sindresorhus/is");
exports.default = (function (url) {
    var options = {
        protocol: url.protocol,
        hostname: url.hostname.startsWith('[') ? url.hostname.slice(1, -1) : url.hostname,
        host: url.host,
        hash: url.hash,
        search: url.search,
        pathname: url.pathname,
        href: url.href,
        path: is_1.default.null_(url.search) ? url.pathname : "" + url.pathname + url.search
    };
    if (is_1.default.string(url.port) && url.port.length > 0) {
        options.port = Number(url.port);
    }
    if (url.username || url.password) {
        options.auth = url.username + ":" + url.password;
    }
    return options;
});