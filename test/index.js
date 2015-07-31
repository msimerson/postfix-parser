'use strict';
/* jshint maxlen: false, camelcase: false, maxstatements: false */
var assert = require('assert');
var util   = require('util');

var re = require('../index');

describe('re.asObject parser', function () {

    it('syslog, spamd line', function () {
        assert.deepEqual(re.asObject('syslog', 'Jul  5 06:52:01 prd-mx1 spamd[11526]: spamd: identified spam (9.3/5.0) for nagios:1209 in 0.8 seconds, 5 bytes.'),
            {
            date: 'Jul  5 06:52:01',
            host: 'prd-mx1',
            prog: 'spamd',
            pid: '11526',
            msg: 'spamd: identified spam (9.3/5.0) for nagios:1209 in 0.8 seconds, 5 bytes.'
        });
    });

    it('syslog postfix/cleanup', function () {
        assert.deepEqual(re.asObject('syslog', 'Jul  5 06:52:11 prd-mx1 postfix/cleanup[21893]: 3mPVKl0Mhjz7sXv: message-id=<E1ZB06G-0006n5-Vp@anc-dev-web1.slc.example.net>'), {
            date: 'Jul  5 06:52:11',
            host: 'prd-mx1',
            prog: 'postfix/cleanup',
            pid: '21893',
            msg: '3mPVKl0Mhjz7sXv: message-id=<E1ZB06G-0006n5-Vp@anc-dev-web1.slc.example.net>',
        });
    });

    it('syslog postfix/qmgr', function () {
        assert.deepEqual( re.asObject('syslog', 'Jul  5 06:52:11 prd-mx1 postfix/qmgr[20459]: 3mPVKl0Mhjz7sXv: from=<>, size=2666, nrcpt=2 (queue active)'), {
            date: 'Jul  5 06:52:11',
            host: 'prd-mx1',
            prog: 'postfix/qmgr',
            pid: '20459',
            msg: '3mPVKl0Mhjz7sXv: from=<>, size=2666, nrcpt=2 (queue active)',
        });
    });

    it('syslog postfix/smtp', function () {
        assert.deepEqual(re.asObject('syslog', 'Jul  5 06:52:11 prd-mx1 postfix/smtp[22030]: 3mPVKl0Mhjz7sXv: to=<56597@continuity.delivery>, relay=10.2.2.85[10.2.2.85]:2527, delay=0.51, delays=0.44/0.01/0.05/0.01, dsn=2.0.0, status=sent (250 2.0.0 Ok: queued as 3mPVKl3YVXz2pS5Z)'), {
            date: 'Jul  5 06:52:11',
            host: 'prd-mx1',
            prog: 'postfix/smtp',
            pid: '22030',
            msg: '3mPVKl0Mhjz7sXv: to=<56597@continuity.delivery>, relay=10.2.2.85[10.2.2.85]:2527, delay=0.51, delays=0.44/0.01/0.05/0.01, dsn=2.0.0, status=sent (250 2.0.0 Ok: queued as 3mPVKl3YVXz2pS5Z)',
        });
    });

    it('postfix/smtp sent', function () {
        assert.deepEqual(
            re.asObject('smtp', '3mPVKl0Mhjz7sXv: to=<susan.bck@example.org>, relay=mpafm.example.org[24.100.200.21]:25, conn_use=2, delay=1.2, delays=0.76/0.01/0.09/0.34, dsn=2.0.0, status=sent (250 2.0.0 t5UI2nBt018923-t5UI2nBw018923 Message accepted for delivery)'),
        {
            qid: '3mPVKl0Mhjz7sXv',
            to: 'susan.bck@example.org',
            relay: 'mpafm.example.org[24.100.200.21]:25',
            conn_use: '2',
            delay: '1.2',
            delays: '0.76/0.01/0.09/0.34',
            dsn: '2.0.0',
            status: 'sent (250 2.0.0 t5UI2nBt018923-t5UI2nBw018923 Message accepted for delivery)',
        });
    });

    it('postfix/smtp sent w/o queue ID', function () {
        assert.deepEqual(
            re.asObject('smtp', 'to=<susan.bck@example.org>, relay=mpafm.example.org[24.100.200.21]:25, conn_use=2, delay=1.2, delays=0.76/0.01/0.09/0.34, dsn=2.0.0, status=sent (250 2.0.0 t5UI2nBt018923-t5UI2nBw018923 Message accepted for delivery)'),
        {
            to: 'susan.bck@example.org',
            relay: 'mpafm.example.org[24.100.200.21]:25',
            conn_use: '2',
            delay: '1.2',
            delays: '0.76/0.01/0.09/0.34',
            dsn: '2.0.0',
            status: 'sent (250 2.0.0 t5UI2nBt018923-t5UI2nBw018923 Message accepted for delivery)',
        });
    });

    it('postfix/smtp bounced', function () {
        assert.deepEqual(re.asObject('smtp', '3mPVKl0Mhjz7sXv: to=<jpayne@recipient.com>, relay=mail2.sender.com[66.100.32.07]:25, conn_use=2, delay=2.5, delays=1.6/0.01/0.08/0.81, dsn=5.7.1, status=bounced (host mail2.sender.com[66.100.32.07] said: 550 5.7.1 Unable to deliver to <jpayne@recipient.com> (in reply to RCPT TO command))'),
        {
            qid: '3mPVKl0Mhjz7sXv',
            to: 'jpayne@recipient.com',
            relay: 'mail2.sender.com[66.100.32.07]:25',
            conn_use: '2',
            delay: '2.5',
            delays: '1.6/0.01/0.08/0.81',
            dsn: '5.7.1',
            status: 'bounced (host mail2.sender.com[66.100.32.07] said: 550 5.7.1 Unable to deliver to <jpayne@recipient.com> (in reply to RCPT TO command))',
        });
    });

    it('postfix/smtp sent', function () {
        assert.deepEqual(re.asObject('smtp', '3mPVKl0Mhjz7sXv: to=<rdunn@example.com>, relay=mailout.example.com[199.200.300.131]:25, conn_use=3, delay=2.3, delays=0.55/0/0.08/1.6, dsn=2.6.0, status=sent (250 2.6.0 message received)'),
        {
            qid: '3mPVKl0Mhjz7sXv',
            to: 'rdunn@example.com',
            relay: 'mailout.example.com[199.200.300.131]:25',
            conn_use: '3',
            delay: '2.3',
            delays: '0.55/0/0.08/1.6',
            dsn: '2.6.0',
            status: 'sent (250 2.6.0 message received)',
        });
    });

    it('postfix/smtp deferred', function () {
        assert.deepEqual(re.asObject('smtp', '3mPVKl0Mhjz7sXv: to=<health-example-ahslott=foo.com@bar.com>, relay=none, delay=55175, delays=55144/0.05/30/0, dsn=4.4.1, status=deferred (connect to dc-452452f6.bar.com[63.200.300.49]:25: Connection timed out)'),
        {
            qid: '3mPVKl0Mhjz7sXv',
            to: 'health-example-ahslott=foo.com@bar.com',
            relay: 'none',
            delay: '55175',
            delays: '55144/0.05/30/0',
            dsn: '4.4.1',
            status: 'deferred (connect to dc-452452f6.bar.com[63.200.300.49]:25: Connection timed out)',
        });
    });

    it('postfix/smtp sent', function () {
        assert.deepEqual(re.asObject('smtp', '3mPVKl0Mhjz7sXv: to=<rob@example.com>, relay=mailfilter.example-dom.com[63.200.2.118]:25, conn_use=2, delay=4.4, delays=2/2.2/0.02/0.14, dsn=2.0.0, status=sent (250 ok: Message 7295650 accepted)'),
        {
            qid: '3mPVKl0Mhjz7sXv',
            to: 'rob@example.com',
            relay: 'mailfilter.example-dom.com[63.200.2.118]:25',
            conn_use: '2',
            delay: '4.4',
            delays: '2/2.2/0.02/0.14',
            dsn: '2.0.0',
            status: 'sent (250 ok: Message 7295650 accepted)',
        });
    });

    it('postfix/smtp continuity', function () {
        assert.deepEqual(re.asObject('smtp', '3mPVKl0Mhjz7sXv: to=<56750@continuity.delivery>, relay=10.2.2.85[10.2.2.85]:2527, delay=1.1, delays=1/0.01/0.04/0.05, dsn=2.0.0, status=sent (250 2.0.0 Ok: queued as 3mKPTL0WpJz45Shm)'),
        {
            qid: '3mPVKl0Mhjz7sXv',
            to: '56750@continuity.delivery',
            relay: '10.2.2.85[10.2.2.85]:2527',
            delay: '1.1',
            delays: '1/0.01/0.04/0.05',
            dsn: '2.0.0',
            status: 'sent (250 2.0.0 Ok: queued as 3mKPTL0WpJz45Shm)',
        });
    });

    it('postfix/smtp error', function () {
        assert.deepEqual(re.asObject('smtp', 'connect to mail.mountaineer.k12.mm.us[70.200.138.252]:25: Connection timed out'),
        {
            action: 'delivery',
            mx: 'mail.mountaineer.k12.mm.us[70.200.138.252]:25',
            err: 'Connection timed out',
        });
    });

    it('postfix/smtp debug', function () {
        assert.deepEqual(re.asObject('smtp', '3mhh843cz2zCpsL: enabling PIX workarounds: disable_esmtp delay_dotcrlf for 69.146.200.300[69.146.200.300]:25'),
        {
            debug: ' enabling PIX workarounds'
        });
    });

    it('postfix/cleanup message-id', function () {
        assert.deepEqual(re.asObject('cleanup', '3mKxs35RQsz7sXF: message-id=<3mKxs308vpz7sXd@mx14.example.net>'),
        {
            qid: '3mKxs35RQsz7sXF',
            'message-id': '3mKxs308vpz7sXd@mx14.example.net',
        });
    });

    it('postfix/cleanup message-id w/o queue ID', function () {
        assert.deepEqual(re.asObject('cleanup', 'message-id=<3mKxs308vpz7sXd@mx14.example.net>'),
        {
            'message-id': '3mKxs308vpz7sXd@mx14.example.net',
        });
    });

    it('postfix/cleanup resent-message-id', function () {
        assert.deepEqual(re.asObject('cleanup', '3mL1Hq0Tgvz7sWh: resent-message-id=<3mL1Hq0Tgvz7sWh@mx14.example.net>'),
        {
            qid: '3mL1Hq0Tgvz7sWh',
            'resent-message-id': '3mL1Hq0Tgvz7sWh@mx14.example.net',
        });
    });

    it('postfix/pickup', function () {
        assert.deepEqual(re.asObject('pickup', '3mKxs308vpz7sXd: uid=1206 from=<system>'),
        {
            qid: '3mKxs308vpz7sXd',
            'uid': '1206',
            from: 'system',
        });
    });

    it('postfix/pickup w/o queue ID', function () {
        assert.deepEqual(re.asObject('pickup', 'uid=1206 from=<system>'),
        {
            'uid': '1206',
            from: 'system',
        });
    });

    it('postfix/error', function () {
        assert.deepEqual(re.asObject('error', '3mJddz5fh3z7sdM: to=<rcarey@example.tv>, relay=none, delay=165276, delays=165276/0.09/0/0.09, dsn=4.4.1, status=deferred (delivery temporarily suspended: connect to 24.200.177.247[24.200.177.247]:25: Connection timed out)'),
        {
            qid: '3mJddz5fh3z7sdM',
            to: 'rcarey@example.tv',
            relay: 'none',
            delay: '165276',
            delays: '165276/0.09/0/0.09',
            dsn: '4.4.1',
            status: 'deferred (delivery temporarily suspended: connect to 24.200.177.247[24.200.177.247]:25: Connection timed out)',
        });
    });

    it('postfix/error w/o queue ID', function () {
        assert.deepEqual(re.asObject('error', 'to=<rcarey@example.tv>, relay=none, delay=165276, delays=165276/0.09/0/0.09, dsn=4.4.1, status=deferred (delivery temporarily suspended: connect to 24.200.177.247[24.200.177.247]:25: Connection timed out)'),
        {
            to: 'rcarey@example.tv',
            relay: 'none',
            delay: '165276',
            delays: '165276/0.09/0/0.09',
            dsn: '4.4.1',
            status: 'deferred (delivery temporarily suspended: connect to 24.200.177.247[24.200.177.247]:25: Connection timed out)',
        });
    });

    it('postfix/error', function () {
        var result = re.asObject('postfix/error', '3lz2cf24l8z2yfC: to=<root@localhost.example.net>, orig_to=<root@localhost>, relay=none, delay=3146377, delays=3146377/0.17/0/0.01, dsn=4.4.1, status=deferred (delivery temporarily suspended: connect to 127.0.0.2[127.0.0.2]:25: Connection refused)');
        assert.deepEqual(result, {
            qid: '3lz2cf24l8z2yfC',
            to: 'root@localhost.example.net',
            orig_to: 'root@localhost',
            relay: 'none',
            delay: '3146377',
            delays: '3146377/0.17/0/0.01',
            dsn: '4.4.1',
            status: 'deferred (delivery temporarily suspended: connect to 127.0.0.2[127.0.0.2]:25: Connection refused)'
        },
        util.inspect(result));
    });

    it('postfix/local', function () {
        assert.deepEqual(re.asObject('local', '3mLQKH6hqhz7sWK: to=<logspam@system.alerts>, relay=local, delay=3.1, delays=1.8/0.86/0/0.44, dsn=2.0.0, status=sent (forwarded as 3mLQKK4rDdz7sVS)'),
        {
            qid: '3mLQKH6hqhz7sWK',
            to: 'logspam@system.alerts',
            relay: 'local',
            delay: '3.1',
            delays: '1.8/0.86/0/0.44',
            dsn: '2.0.0',
            status: 'forwarded',
            forwardedAs: '3mLQKK4rDdz7sVS',
        });
    });

    it('postfix/local w/o queue ID', function () {
        assert.deepEqual(re.asObject('local', 'to=<logspam@system.alerts>, relay=local, delay=3.1, delays=1.8/0.86/0/0.44, dsn=2.0.0, status=sent (forwarded as 3mLQKK4rDdz7sVS)'),
        {
            to: 'logspam@system.alerts',
            relay: 'local',
            delay: '3.1',
            delays: '1.8/0.86/0/0.44',
            dsn: '2.0.0',
            status: 'forwarded',
            forwardedAs: '3mLQKK4rDdz7sVS',
        });
    });

    it('postfix/bounce', function () {
        assert.deepEqual(re.asObject('bounce', '3mKxY750hmz7scK: sender non-delivery notification: 3mKxYH0vl4z7sWS'),
        {
            qid: '3mKxY750hmz7scK',
            dsnQid: '3mKxYH0vl4z7sWS',
        });
    });

    it('postfix/bounce w/o queue ID', function () {
        assert.deepEqual(re.asObject('bounce', 'sender non-delivery notification: 3mKxYH0vl4z7sWS'),
        {
            dsnQid: '3mKxYH0vl4z7sWS',
        });
    });

    it('postfix/qmgr from', function () {
        assert.deepEqual(re.asObject('qmgr', '3mKnNK1XhXz7sgL: from=<spruit@example.org>, size=11445, nrcpt=1 (queue active)'),
        {
            qid: '3mKnNK1XhXz7sgL',
            from: 'spruit@example.org',
            size: '11445',
            nrcpt: '1',
        });
    });

    it('postfix/qmgr from', function () {
        assert.deepEqual(re.asObject('qmgr', '3mfNtc147Bz1M9pl: from=<e13f0bfb.ged.hd0.23.hjdjln+lugoe=maevolen.com@bnc.mailjet.com>, size=79660, nrcpt=1 (queue active)'),
        {
            qid: '3mfNtc147Bz1M9pl',
            from: 'e13f0bfb.ged.hd0.23.hjdjln+lugoe=maevolen.com@bnc.mailjet.com',
            size: '79660',
            nrcpt: '1',
        });
    });

    it('postfix/qmgr from w/o queue ID', function () {
        assert.deepEqual(re.asObject('qmgr', 'from=<spruit@example.org>, size=11445, nrcpt=1 (queue active)'),
        {
            from: 'spruit@example.org',
            size: '11445',
            nrcpt: '1',
        });
    });

    it('postfix/qmgr expired', function () {
        assert.deepEqual(re.asObject('qmgr', '3l8L6X6lCPz7t2M: from=<deedee@example.com>, status=expired, returned to sender'),
        {
            qid: '3l8L6X6lCPz7t2M',
            from: 'deedee@example.com',
            status: 'expired, returned to sender',
        });
    });

    it('postfix/qmgr removed', function () {
        assert.deepEqual(re.asObject('qmgr', '3l8L6X6lCPz7t2M: removed'),
        {
            qid: '3l8L6X6lCPz7t2M',
            action: 'removed',
        });
    });

    it('postfix/scache', function () {
        assert.deepEqual(re.asObject('scache', 'statistics: domain lookup hits=0 miss=3 success=0%'),
        {
            statistics: 'domain lookup hits=0 miss=3 success=0%',
        });
    });

    it('postfix/postscreen', function () {
        assert.deepEqual(re.asObject('postscreen', 'WHITELISTED [10.2.2.91]:56553'),
        {
            postscreen: 'WHITELISTED [10.2.2.91]:56553',
        });
    });

    it('empty args, empty result', function () {
        assert.deepEqual(re.asObject('', ''), undefined);
    });
});
