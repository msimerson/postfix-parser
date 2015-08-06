'use strict';

if (process.env.COVERAGE) require('blanket');

var envEmailAddr   = '<([^>]*)>';
var postfixQid     = '[0-9A-F]{10,11}';     // default queue ids
var postfixQidLong = '[0-9A-Za-z]{14,16}';  // optional 'long' ids
var postfixQidAny  = postfixQidLong + '|' + postfixQid;

var regex = {
    /* jshint maxlen: 100 */
    syslog: /^([A-Za-z]{3} [0-9 ]{2} [\d:]{8}) ([^\s]+) ([^\[]+)\[([\d]+)\]: (.*)$/,
    smtp : new RegExp(
            '^(?:(' + postfixQidAny + '): )?' +
            '(to)=' + envEmailAddr + ', ' +
            '(?:(orig_to)=' + envEmailAddr + ', )?' +
            '(relay)=([^,]+), ' +
            '(?:(conn_use)=([0-9]+), )?' +
            '(delay)=([^,]+), ' +
            '(delays)=([^,]+), ' +
            '(dsn)=([^,]+), ' +
            '(status)=(.*)$'
        ),
    'smtp-defer' : new RegExp(
        '^(?:(' + postfixQidAny + '): )?' +
        '(?:host) ([^ ]+) ' +
        '(?:said|refused to talk to me): ' +
        '(4[0-9]{2} .*)$'
        // '(?: \\(in reply to (?:end of )?([A-Z ]+) command\\))*'
        ),
    'smtp-timeout' : new RegExp(
        '^(?:(' + postfixQidAny + '): )?' +
        'conversation with ([^ ]+) ' +
        'timed out ' + '(.*)$'
        ),
    'smtp-reject' : new RegExp(
        '^(?:(' + postfixQidAny + '): )?' +
        'host ([^ ]+) ' +
        '(?:said|refused to talk to me): (5[0-9]{2}.*)$'
        ),
    'smtp-conn-err': /^connect to ([^ ]+): (.*)$/,
    'smtp-debug': new RegExp(
            '(?:(' + postfixQidAny + '): )?' +
            '(enabling PIX workarounds|' +
            'Cannot start TLS: handshake failure|' +
            'lost connection with .*|' +
            '^SSL_connect error to .*|' +
            '^warning: .*|' +
            'conversation with |' +
            'host )'
        ),
    qmgr : new RegExp(
            '^(?:(' + postfixQidAny + '): )?' +
            '(from)=' + envEmailAddr + ', ' +
            '(?:' +
            '(size)=([0-9]+), ' +
            '(nrcpt)=([0-9]+) ' +
            '|' +
            '(status)=(.*)$' +
            ')'
        ),
    'qmgr-removed': new RegExp('^(' + postfixQidAny + '): removed'),
    // postfix sometimes truncates the message-id, so don't require ending >
    cleanup : new RegExp(
            '^(?:(' + postfixQidAny + '): )?' +
            '((?:resent-)?message-id)=<(.*?)>?$'
        ),
    pickup : new RegExp(
            '^(?:(' + postfixQidAny + '): )?' +
            '(uid)=([0-9]+) ' +
            '(from)=' + envEmailAddr
        ),
    'pickup-warning' : new RegExp(
            '^warning: ' +
            '(' + postfixQidAny + '): ' +
            '(.*)$'
        ),
    'error' : new RegExp(
            '^(?:(' + postfixQidAny + '): )?' +
            '(to)=' + envEmailAddr + ', ' +
            '(?:(orig_to)=' + envEmailAddr + ', )?' +
            '(relay)=([^,]+), ' +
            '(delay)=([^,]+), ' +
            '(delays)=([^,]+), ' +
            '(dsn)=([^,]+), ' +
            '(status)=(.*)$'
        ),
    'error-warning' : new RegExp(
        '^warning: ' +
            '(' + postfixQidAny + '): ' +
            '(.*)$'
        ),
    bounce : new RegExp(
            '^(?:(' + postfixQidAny + '): )?' +
            'sender non-delivery notification: ' +
            '(' + postfixQidAny + '$)'
        ),
    'bounce-fatal' : new RegExp(
            '^fatal: ' +
            '(.*?) ' +
            '(' + postfixQidAny + '): ' +
            '(.*)$'
        ),
    local : new RegExp(
            '^(?:(' + postfixQidAny + '): )?' +
            '(to)=' + envEmailAddr + ', ' +
            '(?:(orig_to)=' + envEmailAddr + ', )?' +
            '(relay)=([^,]+), ' +
            '(delay)=([^,]+), ' +
            '(delays)=([^,]+), ' +
            '(dsn)=([^,]+), ' +
            '(status)=(sent .*)$'
        ),
    forwardedAs : new RegExp('forwarded as (' + postfixQidAny + ')\\)'),
    scache : new RegExp('^statistics: (.*)'),
    postscreen : new RegExp('^(.*)'),
};

exports.asObject = function (line) {

    var match = line.match(regex.syslog);
    if (!match) {
        console.error('unparsable syslog: ' + line);
        return;
    }

    var syslog = syslogAsObject(match);
    if (!/^postfix/.test(syslog.prog)) return; // not postfix, ignore

    var parsed = exports.asObjectType(syslog.prog, syslog.msg);
    if (!parsed) {
        console.error('unparsable ' + syslog.prog + ': ' + syslog.msg);
        return;
    }

    ['date','host','prog','pid'].forEach(function (f) {
        if (!syslog[f]) return;
        parsed[f] = syslog[f];
    });

    return parsed;
};

exports.asObjectType = function (type, line) {
    /* jshint maxstatements: 25 */
    if (!type || !line) {
        console.error('missing required arg');
        return;
    }
    if ('postfix/' === type.substr(0,8)) type = type.substr(8);
    if (type === 'qmgr') return qmgrAsObject(line);
    if (type === 'smtp') return smtpAsObject(line);
    if (type === 'pickup') return pickupAsObject(line);
    if (type === 'error') return errorAsObject(line);
    if (type === 'bounce') return bounceAsObject(line);

    var match = line.match(regex[type]);
    if (!match) return;

    if (type === 'syslog') return syslogAsObject(match);
    if (type === 'scache') return { statistics: match[1] };
    if (type === 'postscreen') return { postscreen: match[1] };
    if (type === 'local')  return localAsObject(match);

    return matchAsObject(match);
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
    match.shift();
    var obj = {};
    var qid = match.shift();
    if (qid) obj.qid = qid;
    while (match.length) {
        var key = match.shift();
        var val = match.shift();
        if (key && val) obj[key] = val;
    }
    return obj;
}

function errorAsObject (line) {
    var match = line.match(regex.error);
    if (match) return matchAsObject(match);

    match = line.match(regex['error-warning']);
    if (match) return {
        qid: match[1],
        msg: match[2],
    };
}

function pickupAsObject (line) {
    var match = line.match(regex.pickup);
    if (match) return matchAsObject(match);

    match = line.match(regex['pickup-warning']);
    if (match) return {
        qid: match[1],
        msg: match[2],
    };
}

function smtpAsObject (line) {
    var match = line.match(regex.smtp);
    if (match) return matchAsObject(match);

    match = line.match(regex['smtp-conn-err']);
    if (match) return {
        action: 'delivery',
        mx: match[1],
        err: match[2]
    };

    match = line.match(regex['smtp-defer']);
    if (match) return {
        action: 'defer',
        qid: match[1],
        host: match[2],
        msg: match[3]
    };

    match = line.match(regex['smtp-reject']);
    if (match) return {
        action: 'reject',
        qid: match[1],
        host: match[2],
        msg: match[3],
    };

    match = line.match(regex['smtp-timeout']);
    if (match) return {
        action: 'defer',
        qid: match[1],
        host: match[2],
        msg: match[3],
    };

    match = line.match(regex['smtp-debug']);
    if (!match) return;
    if (match[1] && match[2]) return {
        qid: match[1],
        msg: match[2],
    };
    return { msg: match[0] };
}

function bounceAsObject (line) {

    var match = line.match(regex.bounce);
    if (match) {
        match.shift();
        var obj = {};
        var qid = match.shift();
        if (qid) obj.qid = qid;
        obj.dsnQid = match.shift();
        return obj;
    }

    match = line.match(regex['bounce-fatal']);
    if (match) return {
        qid: match[2],
        msg: 'fatal: ' + match[1] + ': ' + match[3]
    };
}

function qmgrAsObject (line) {
    var match = line.match(regex.qmgr);
    if (match) return matchAsObject(match);

    match = line.match(regex['qmgr-removed']);
    if (match) return { qid: match[1], action: 'removed' };
}

function localAsObject(match) {
    var obj = matchAsObject(match);
    var m = obj.status.match(regex.forwardedAs);
    if (m) {
        obj.status = 'forwarded';
        obj.forwardedAs = m[1];
    }
    return obj;
}
