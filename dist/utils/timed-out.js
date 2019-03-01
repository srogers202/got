"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const net_1 = __importDefault(require("net"));
class TimeoutError extends Error {
    constructor(threshold, event) {
        super(`Timeout awaiting '${event}' for ${threshold}ms`);
        this.name = 'TimeoutError';
        this.code = 'ETIMEDOUT';
        this.event = event;
    }
}
exports.TimeoutError = TimeoutError;
const reentry = Symbol('reentry');
const noop = () => { };
exports.default = (request, delays, options) => {
    /* istanbul ignore next: this makes sure timed-out isn't called twice */
    if (Reflect.has(request, reentry)) {
        return;
    }
    request[reentry] = true;
    let stopNewTimeouts = false;
    const addTimeout = (delay, callback, ...args) => {
        // An error had been thrown before. Going further would result in uncaught errors.
        // See https://github.com/sindresorhus/got/issues/631#issuecomment-435675051
        if (stopNewTimeouts) {
            return noop;
        }
        // Event loop order is timers, poll, immediates.
        // The timed event may emit during the current tick poll phase, so
        // defer calling the handler until the poll phase completes.
        let immediate;
        const timeout = setTimeout(() => {
            immediate = setImmediate(callback, delay, ...args);
            /* istanbul ignore next: added in node v9.7.0 */
            if (immediate.unref) {
                immediate.unref();
            }
        }, delay);
        /* istanbul ignore next: in order to support electron renderer */
        if (timeout.unref) {
            timeout.unref();
        }
        const cancel = () => {
            clearTimeout(timeout);
            clearImmediate(immediate);
        };
        cancelers.push(cancel);
        return cancel;
    };
    const { host, hostname } = options;
    const timeoutHandler = (delay, event) => {
        request.emit('error', new TimeoutError(delay, event));
        request.abort();
    };
    const cancelers = [];
    const cancelTimeouts = () => {
        stopNewTimeouts = true;
        cancelers.forEach(cancelTimeout => cancelTimeout());
    };
    request.on('error', (error) => {
        if (error.message !== 'socket hang up') {
            cancelTimeouts();
        }
    });
    request.once('response', response => {
        response.once('end', cancelTimeouts);
    });
    if (delays.request !== undefined) {
        addTimeout(delays.request, timeoutHandler, 'request');
    }
    if (delays.socket !== undefined) {
        const socketTimeoutHandler = () => {
            timeoutHandler(delays.socket, 'socket');
        };
        request.setTimeout(delays.socket, socketTimeoutHandler);
        // `request.setTimeout(0)` causes a memory leak.
        // We can just remove the listener and forget about the timer - it's unreffed.
        // See https://github.com/sindresorhus/got/issues/690
        cancelers.push(() => {
            request.removeListener('timeout', socketTimeoutHandler);
        });
    }
    request.once('socket', (socket) => {
        const { socketPath } = request;
        /* istanbul ignore next: hard to test */
        if (socket.connecting) {
            if (delays.lookup !== undefined && !socketPath && !net_1.default.isIP(hostname || host)) {
                const cancelTimeout = addTimeout(delays.lookup, timeoutHandler, 'lookup');
                socket.once('lookup', cancelTimeout);
            }
            if (delays.connect !== undefined) {
                const timeConnect = () => addTimeout(delays.connect, timeoutHandler, 'connect');
                if (socketPath || net_1.default.isIP(hostname || host)) {
                    socket.once('connect', timeConnect());
                }
                else {
                    socket.once('lookup', (error) => {
                        if (error === null) {
                            socket.once('connect', timeConnect());
                        }
                    });
                }
            }
            if (delays.secureConnect !== undefined && options.protocol === 'https:') {
                socket.once('connect', () => {
                    const cancelTimeout = addTimeout(delays.secureConnect, timeoutHandler, 'secureConnect');
                    socket.once('secureConnect', cancelTimeout);
                });
            }
        }
        if (delays.send !== undefined) {
            const timeRequest = () => addTimeout(delays.send, timeoutHandler, 'send');
            /* istanbul ignore next: hard to test */
            if (socket.connecting) {
                socket.once('connect', () => {
                    request.once('upload-complete', timeRequest());
                });
            }
            else {
                request.once('upload-complete', timeRequest());
            }
        }
    });
    if (delays.response !== undefined) {
        request.once('upload-complete', () => {
            const cancelTimeout = addTimeout(delays.response, timeoutHandler, 'response');
            request.once('response', cancelTimeout);
        });
    }
    return cancelTimeouts;
};
//# sourceMappingURL=timed-out.js.map