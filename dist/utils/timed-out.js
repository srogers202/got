"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var net_1 = require("net");
var TimeoutError = /** @class */ (function (_super) {
    __extends(TimeoutError, _super);
    function TimeoutError(threshold, event) {
        var _this = _super.call(this, "Timeout awaiting '" + event + "' for " + threshold + "ms") || this;
        _this.name = 'TimeoutError';
        _this.code = 'ETIMEDOUT';
        _this.event = event;
        return _this;
    }
    return TimeoutError;
}(Error));
exports.TimeoutError = TimeoutError;
var reentry = Symbol('reentry');
var noop = function () { };
exports.default = (function (request, delays, options) {
    /* istanbul ignore next: this makes sure timed-out isn't called twice */
    if (Reflect.has(request, reentry)) {
        return;
    }
    request[reentry] = true;
    var stopNewTimeouts = false;
    var addTimeout = function (delay, callback) {
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        // An error had been thrown before. Going further would result in uncaught errors.
        // See https://github.com/sindresorhus/got/issues/631#issuecomment-435675051
        if (stopNewTimeouts) {
            return noop;
        }
        // Event loop order is timers, poll, immediates.
        // The timed event may emit during the current tick poll phase, so
        // defer calling the handler until the poll phase completes.
        var immediate;
        var timeout = setTimeout(function () {
            immediate = setImmediate.apply(void 0, [callback, delay].concat(args));
            /* istanbul ignore next: added in node v9.7.0 */
            if (immediate.unref) {
                immediate.unref();
            }
        }, delay);
        /* istanbul ignore next: in order to support electron renderer */
        if (timeout.unref) {
            timeout.unref();
        }
        var cancel = function () {
            clearTimeout(timeout);
            clearImmediate(immediate);
        };
        cancelers.push(cancel);
        return cancel;
    };
    var host = options.host, hostname = options.hostname;
    var timeoutHandler = function (delay, event) {
        request.emit('error', new TimeoutError(delay, event));
        request.abort();
    };
    var cancelers = [];
    var cancelTimeouts = function () {
        stopNewTimeouts = true;
        cancelers.forEach(function (cancelTimeout) { return cancelTimeout(); });
    };
    request.on('error', function (error) {
        if (error.message !== 'socket hang up') {
            cancelTimeouts();
        }
    });
    request.once('response', function (response) {
        response.once('end', cancelTimeouts);
    });
    if (delays.request !== undefined) {
        addTimeout(delays.request, timeoutHandler, 'request');
    }
    if (delays.socket !== undefined) {
        var socketTimeoutHandler_1 = function () {
            timeoutHandler(delays.socket, 'socket');
        };
        request.setTimeout(delays.socket, socketTimeoutHandler_1);
        // `request.setTimeout(0)` causes a memory leak.
        // We can just remove the listener and forget about the timer - it's unreffed.
        // See https://github.com/sindresorhus/got/issues/690
        cancelers.push(function () {
            request.removeListener('timeout', socketTimeoutHandler_1);
        });
    }
    request.once('socket', function (socket) {
        var socketPath = request.socketPath;
        /* istanbul ignore next: hard to test */
        if (socket.connecting) {
            if (delays.lookup !== undefined && !socketPath && !net_1.default.isIP(hostname || host)) {
                var cancelTimeout = addTimeout(delays.lookup, timeoutHandler, 'lookup');
                socket.once('lookup', cancelTimeout);
            }
            if (delays.connect !== undefined) {
                var timeConnect_1 = function () { return addTimeout(delays.connect, timeoutHandler, 'connect'); };
                if (socketPath || net_1.default.isIP(hostname || host)) {
                    socket.once('connect', timeConnect_1());
                }
                else {
                    socket.once('lookup', function (error) {
                        if (error === null) {
                            socket.once('connect', timeConnect_1());
                        }
                    });
                }
            }
            if (delays.secureConnect !== undefined && options.protocol === 'https:') {
                socket.once('connect', function () {
                    var cancelTimeout = addTimeout(delays.secureConnect, timeoutHandler, 'secureConnect');
                    socket.once('secureConnect', cancelTimeout);
                });
            }
        }
        if (delays.send !== undefined) {
            var timeRequest_1 = function () { return addTimeout(delays.send, timeoutHandler, 'send'); };
            /* istanbul ignore next: hard to test */
            if (socket.connecting) {
                socket.once('connect', function () {
                    request.once('upload-complete', timeRequest_1());
                });
            }
            else {
                request.once('upload-complete', timeRequest_1());
            }
        }
    });
    if (delays.response !== undefined) {
        request.once('upload-complete', function () {
            var cancelTimeout = addTimeout(delays.response, timeoutHandler, 'response');
            request.once('response', cancelTimeout);
        });
    }
    return cancelTimeouts;
});
