[![Build Status][ci-img]][ci-url]
[![Coverage Status][cov-img]][cov-url]
[![Code Climate][clim-img]][clim-url]

# Postfix Parser

It parses postfix log entries.

    const parser = require('postfix-parser');

Each postfix program (smtp/qmgr/cleanup/etc..) has its own format. See the test file for complete examples.

# Functions

## asObject

Call with a syslog line:

    parser.asObject('Jul  5 06:52:11 mx1 postfix/qmgr[20459]: 3mPVKl...');

Returns an object:

```js
{
    date: 'Jul  5 06:52:11',
    host: 'prd-mx1',
    prog: 'postfix/qmgr',
    pid: '20459',
    qid: '3mPVKl0Mhjz7sXv',
    size: '2666',
    nrcpt: '2',
}
```

----

## asObjectType

requires two positional arguments:

1. type (see Parser Types)
2. a single line syslog entry (or snippet)

`asObjectType` is most useful when the log lines have already been partially parsed, such as by Logstash.

### Typical Usage

```js
const parsed = parser.asObjectType('syslog', data);
if (!parsed) return; // unparseable syslog line

if (!/^postfix/.test(parsed.prog)) return;  // not a postfix line

const msg = parser.asObject(parsed.prog, parsed.msg);
```

`msg` is an object of `parsed.prog` type (see examples below)

----

## Parser Types

### syslog

```js
asObject(
    'syslog',
    'Jul  5 06:52:11 prd-mx1 postfix/qmgr[20459]: 3mPVKl0Mhjz7sXv: from=<>, size=2666, nrcpt=2 (queue active)'
);
```

Returns:

```js
{
    date: 'Jul  5 06:52:11',
    host: 'prd-mx1',
    prog: 'postfix/qmgr',
    pid: '20459',
    msg: '3mPVKl0Mhjz7sXv: from=<>, size=2666, nrcpt=2 (queue active)',
}
```

This is comparable to what you'd already have in Elasticsearch if you had imported your logs using Logstash.

----

### qmgr

```js
asObject('3mPVKl0Mhjz7sXv: from=<>, size=2666, nrcpt=2 (queue active)');
```

Returns:

```js
{
    qid: '3mPVKl0Mhjz7sXv',
    from: ''
    size: '2666',
    nrcpt: '2',
}
```

----

### smtp

```js
asObject('3mPVKl0Mhjz7sXv: to=<sam.bck@example.org>, relay=mafm.example.org[24.100.200.21]:25, conn_use=2, delay=1.2, delays=0.76/0.01/0.09/0.34, dsn=2.0.0, status=sent (250 2.0.0 t5UI2nBt018923-t5UI2nBw018923 Message accepted for delivery)');
```

Returns:

```js
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
```
----

### cleanup

```js
asObject('3mKxs35RQsz7sXF: message-id=<3mKxs308vpz7sXd@mx14.example.net>');
```

Returns:

```js
{
    qid: '3mKxs35RQsz7sXF',
    'message-id': '3mKxs308vpz7sXd@mx14.example.net',
}
```

----

### error

```js
asObject('3mJddz5fh3z7sdM: to=<rcarey@example.tv>, relay=none, delay=165276, delays=165276/0.09/0/0.09, dsn=4.4.1, status=deferred (delivery temporarily suspended: connect to 24.200.177.247[24.200.177.247]:25: Connection timed out)')
```

Returns:

```js
{
    qid: '3mJddz5fh3z7sdM',
    to: 'rcarey@example.tv',
    relay: 'none',
    delay: '165276',
    delays: '165276/0.09/0/0.09',
    dsn: '4.4.1',
    status: 'deferred (delivery temporarily suspended: connect to 24.200.177.247[24.200.177.247]:25: Connection timed out)',
}
```

----

### bounce

```js
asObject('3mKxY750hmz7scK: sender non-delivery notification: 3mKxYH0vl4z7sWS')
```

Returns:

```js
{
    qid: '3mKxY750hmz7scK',
    dsnQid: '3mKxYH0vl4z7sWS',
}
```

----

### scache

```js
asObject('statistics: domain lookup hits=0 miss=3 success=0%')
```

Returns:

```js
{
    statistics: 'domain lookup hits=0 miss=3 success=0%',
}
```

----

### pickup

```js
asObject('3mKxs308vpz7sXd: uid=1206 from=<system>')
```

Returns:

```js
{
    qid: '3mKxs308vpz7sXd',
    'uid': '1206',
    from: 'system',
}
```

----

### local

```js
asObject('3mLQKH6hqhz7sWK: to=<logspam@system.alerts>, relay=local, delay=3.1, delays=1.8/0.86/0/0.44, dsn=2.0.0, status=sent (forwarded as 3mLQKK4rDdz7sVS)')
```

Returns:

```js
{
    qid: '3mLQKH6hqhz7sWK',
    to: 'logspam@system.alerts',
    relay: 'local',
    delay: '3.1',
    delays: '1.8/0.86/0/0.44',
    dsn: '2.0.0',
    status: 'forwarded',
    forwardedAs: '3mLQKK4rDdz7sVS',
}
```


## See also

See [log-ship-elastic-postfix](https://github.com/msimerson/log-ship-elastic-postfix) for an example of combining all log entries for a single message into a normalized document.


<sub>Copyright 2015 by eFolder, Inc.</sub>

[ci-img]: https://github.com/msimerson/postfix-parser/actions/workflows/ci.yml/badge.svg
[ci-url]: https://github.com/msimerson/postfix-parser/actions/workflows/ci.yml
[cov-img]: https://codecov.io/github/msimerson/postfix-parser/coverage.svg?branch=master
[cov-url]: https://codecov.io/github/msimerson/postfix-parser?branch=master
[clim-img]: https://codeclimate.com/github/msimerson/postfix-parser/badges/gpa.svg
[clim-url]: https://codeclimate.com/github/msimerson/postfix-parser
