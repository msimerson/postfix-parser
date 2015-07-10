'use strict';

if (process.env.COVERAGE) require('blanket');

var envEmailAddr   = '<([^>]*)>';
var postfixQid     = '[0-9A-F]{10,11}';     // default queue ids
var postfixQidLong = '[0-9A-Za-z]{14,15}';  // optional 'long' ids
var postfixQidAny  = postfixQidLong + '|' + postfixQid;

/* jshint maxlen: 90 */
var regex = {
    syslog: /^([A-Za-z]{3} [0-9 ]{2} [\d:]{8}) ([^\s]+) ([^\[]+)\[([\d]+)\]: (.*)$/,
    smtp : new RegExp(
            '^(' + postfixQidAny + '): ' +
            '(to)=' + envEmailAddr + ', ' +
            '(?:(orig_to)=' + envEmailAddr + ', )?' +
            '(relay)=([^,]+), ' +
            '(?:(conn_use)=([0-9]+), )?' +
            '(delay)=([^,]+), ' +
            '(delays)=([^,]+), ' +
            '(dsn)=([^,]+), ' +
            '(status)=(.*)$'
        ),
    'smtp-conn-err': /^connect to ([^\s]+): (.*)$/,
    qmgr : new RegExp(
            '^(' + postfixQidAny + '): ' +
            '(from)=' + envEmailAddr + ', ' +
            '(?:' +
            '(size)=([0-9]+), ' +
            '(nrcpt)=([0-9]+) ' +
            '|' +
            '(status)=(.*)$' +
            ')'
        ),
    'qmgr-removed': new RegExp('^(' + postfixQidAny + '): removed'),
    cleanup : new RegExp(
            '^(' + postfixQidAny + '): ' +
            '((?:resent-)?message-id)=' + envEmailAddr 
        ),
    pickup : new RegExp(
            '^(' + postfixQidAny + '): ' +
            '(uid)=([0-9]+) ' +
            '(from)=' + envEmailAddr
        ),
    'error' : new RegExp(
            '^(' + postfixQidAny + '): ' +
            '(to)=' + envEmailAddr + ', ' +
            '(relay)=([^,]+), ' +
            '(delay)=([^,]+), ' +
            '(delays)=([^,]+), ' +
            '(dsn)=([^,]+), ' +
            '(status)=(.*)$'
        ),
    bounce : new RegExp(
            '^(' + postfixQidAny + '): ' +
            'sender non-delivery notification: ' +
            '(' + postfixQidAny + '$)'
        ),
    local : new RegExp(
            '^(' + postfixQidAny + '): ' +
            '(to)=' + envEmailAddr + ', ' +
            '(relay)=([^,]+), ' +
            '(delay)=([^,]+), ' +
            '(delays)=([^,]+), ' +
            '(dsn)=([^,]+), ' +
            '(status)=sent ' +
            '\\((forwarded) (as) ' +
            '(' + postfixQidAny + ')' +
            '\\)$'
        ),
    scache : new RegExp('^statistics: (.*)'),
};

exports.asObject = function (type, line) {
    if (type === 'qmgr') return qmgrAsObject(line);
    if (type === 'smtp') return smtpAsObject(line);
    var match = line.match(regex[type]);
    if (!match) return;
    if (type === 'syslog') return syslogAsObject(match);
    if (type === 'bounce') return bounceAsObject(match);
    if (type === 'scache') return { statistics: match[1] };
    match.shift();
    var obj = { qid: match.shift() };
    while (match.length) {
        var key = match.shift();
        var val = match.shift();
        if (type === 'local' && key === 'as') key = 'forwardedAs';
        if (key && val) obj[key] = val;
    }
    return obj;
};

function syslogAsObject (match) {
    return {
        date: match[1],
        host: match[2],
        prog: match[3],
        pid : match[4],
        msg:  match[5],
    };
}

function matchAsObject (match) {
    var obj = { qid: match.shift() };
    while (match.length) {
        var key = match.shift();
        var val = match.shift();
        if (key && val) obj[key] = val;
    }
    return obj;
}

function smtpAsObject (line) {
    var match = line.match(regex.smtp);
    if (!match) {
        match = line.match(regex['smtp-conn-err']);
        if (match) return { remote: match[1], error: match[2]  };
        return;
    }
    match.shift();
    return matchAsObject(match);
}

function bounceAsObject (match) {
    match.shift();
    return {
        qid:    match.shift(),
        dsnQid: match.shift(),
    };
}

function qmgrAsObject (line) {
    var match = line.match(regex.qmgr);
    if (!match) {
        match = line.match(regex['qmgr-removed']);
        if (match) return { qid: match[1], action: 'removed' };
        return;
    }
    match.shift();
    return matchAsObject(match);
}
