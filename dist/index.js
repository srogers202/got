'use strict';
var pkg = require('../package.json');
var create = require('./create');
var defaults = {
    options: {
        retry: {
            retries: 2,
            methods: [
                'GET',
                'PUT',
                'HEAD',
                'DELETE',
                'OPTIONS',
                'TRACE'
            ],
            statusCodes: [
                408,
                413,
                429,
                500,
                502,
                503,
                504
            ],
            errorCodes: [
                'ETIMEDOUT',
                'ECONNRESET',
                'EADDRINUSE',
                'ECONNREFUSED',
                'EPIPE',
                'ENOTFOUND',
                'ENETUNREACH',
                'EAI_AGAIN'
            ]
        },
        headers: {
            'user-agent': pkg.name + "/" + pkg.version + " (https://github.com/sindresorhus/got)"
        },
        hooks: {
            beforeRequest: [],
            beforeRedirect: [],
            beforeRetry: [],
            afterResponse: []
        },
        decompress: true,
        throwHttpErrors: true,
        followRedirect: true,
        stream: false,
        cache: false,
        dnsCache: false,
        useElectronNet: false,
        responseType: 'text',
        resolveBodyOnly: false
    },
    mutableDefaults: false
};
var got = create(defaults);
module.exports = got;
