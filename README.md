[![Build Status][ci-img]][ci-url]
[![Coverage Status][cov-img]][cov-url]

## Postfix Parser

It parses postfix log entries.

    var parser = require('postfix-parser');

### asObject

Exports and single function: asObject, which requires two positional arguments:

1. type (see Parser Types)
2. a single line syslog entry (or snippet)

### Typical Usage

    var parsed = parser.asObject('syslog', data);
    if (!parsed) {
        // do something with unparseable syslog lines
        return;
    }
    // parsed is an object (see Parser Types -> syslog)

    if (! /^postfix/.test(parsed.prog) ) {
        // not a postfix line, you probably have these, do what you want
        return;
    }

    // match[1] is the postfix program (qmgr, smtp, bounce ...)
    var msg = parser.asObject(parsed.prog, parsed.msg);

    // msg <-- an object of the type matched above (see examples below)


## Parser Types

### syslog

    var res = parser.asObject('syslog',
        'Jul  5 06:52:11 prd-mx1 postfix/qmgr[20459]: 3mPVKl0Mhjz7sXv: from=<>, size=2666, nrcpt=2 (queue active)',
    );

    // res
    {
        date: 'Jul  5 06:52:11',
        host: 'prd-mx1',
        prog: 'postfix/qmgr',
        pid: '20459',
        msg: '3mPVKl0Mhjz7sXv: from=<>, size=2666, nrcpt=2 (queue active)',
    }

### qmgr

    var res = parser.asObject('qmgr', '3mPVKl0Mhjz7sXv: from=<>, size=2666, nrcpt=2 (queue active)');

    {
        date: 'Jul  5 06:52:11',
        host: 'prd-mx1',
        prog: 'postfix/qmgr',
        pid: '20459',
        msg: '3mPVKl0Mhjz7sXv: from=<>, size=2666, nrcpt=2 (queue active)',
    }

### smtp

    var res = parser.asObject('smtp', 
        '3mPVKl0Mhjz7sXv: to=<sam.bck@example.org>, relay=mafm.example.org[24.100.200.21]:25, conn_use=2, delay=1.2, delays=0.76/0.01/0.09/0.34, dsn=2.0.0, status=sent (250 2.0.0 t5UI2nBt018923-t5UI2nBw018923 Message accepted for delivery)'
    );

    // res
    {
        qid: '3mPVKl0Mhjz7sXv',
        to: 'sam.bck@example.org',
        relay: 'mafm.example.org[24.100.200.21]:25',
        conn_use: '2',
        delay: '1.2',
        delays: '0.76/0.01/0.09/0.34',
        dsn: '2.0.0',
        status: 'sent (250 2.0.0 t5UI2nBt018923-t5UI2nBw018923 Message accepted for delivery)',
    }

    // do something clever with that beautifully parsed data
    // may I suggest, [log-ship-elasticsearch-postfix](https://github.com/DoubleCheck/log-ship-elasticsearch-postfix)

### cleanup
### error
### bounce
### scache
### pickup
### local

Each postfix program has its own format. See the test file for complete examples for every postfix program.

## See also

See [log-ship-elasticsearch-postfix](https://github.com/DoubleCheck/log-ship-elasticsearch-postfix) for an example of combining all log entries for a message into a normalized document.


[ci-img]: https://travis-ci.org/DoubleCheck/postfix-parser.svg
[ci-url]: https://travis-ci.org/DoubleCheck/postfix-parser
[cov-img]: https://coveralls.io/repos/DoubleCheck/postfix-parser/badge.svg
[cov-url]: https://coveralls.io/github/DoubleCheck/postfix-parser
