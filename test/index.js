
const assert = require('assert')
const util   = require('util')

const re     = require('../index')

const syslogLines = [
  {
    name: 'spamd',
    line: 'Jul  5 06:52:01 prd-mx1 spamd[11526]: spamd: identified spam (9.3/5.0) for nagios:1209 in 0.8 seconds, 5 bytes.',
    obj : undefined,
  },
  {
    name: 'postfix/cleanup',
    line: 'Jul  5 06:52:11 prd-mx1 postfix/cleanup[21893]: 3mPVKl0Mhjz7sXv: message-id=<E1ZB06G-0006n5-Vp@anc-dev-web1.slc.example.net>',
    obj : {
      date        : 'Jul  5 06:52:11',
      host        : 'prd-mx1',
      prog        : 'postfix/cleanup',
      pid         : '21893',
      qid         : '3mPVKl0Mhjz7sXv',
      'message-id': 'E1ZB06G-0006n5-Vp@anc-dev-web1.slc.example.net',
    },
  },
  {
    name: 'postfix/qmgr',
    line: 'Jul  5 06:52:11 prd-mx1 postfix/qmgr[20459]: 3mPVKl0Mhjz7sXv: from=<>, size=2666, nrcpt=2 (queue active)',
    obj : {
      qid  : '3mPVKl0Mhjz7sXv',
      from : '',
      size : '2666',
      nrcpt: '2',
      date : 'Jul  5 06:52:11',
      host : 'prd-mx1',
      prog : 'postfix/qmgr',
      pid  : '20459',
    },
  },
  {
    name: 'postfix/qmgr, no angle brackets',
    line: 'Sep 25 12:07:56 rory-dev postfix/qmgr[1626]: ED373F8043E: from=rory@rory-dev.localdomain, size=270, nrcpt=1 (queue active)',
    obj : {
      qid  : 'ED373F8043E',
      from : 'rory@rory-dev.localdomain',
      size : '270',
      nrcpt: '1',
      date : 'Sep 25 12:07:56',
      host : 'rory-dev',
      prog : 'postfix/qmgr',
      pid  : '1626',
    },
  },
  {
    name: 'postfix/smtp',
    line: 'Jul  5 06:52:11 prd-mx1 postfix/smtp[22030]: 3mPVKl0Mhjz7sXv: to=<56597@continuity.delivery>, relay=10.2.2.85[10.2.2.85]:2527, delay=0.51, delays=0.44/0.01/0.05/0.01, dsn=2.0.0, status=sent (250 2.0.0 Ok: queued as 3mPVKl3YVXz2pS5Z)',
    obj : {
      date  : 'Jul  5 06:52:11',
      host  : 'prd-mx1',
      prog  : 'postfix/smtp',
      pid   : '22030',
      qid   : '3mPVKl0Mhjz7sXv',
      to    :  '56597@continuity.delivery',
      relay : '10.2.2.85[10.2.2.85]:2527',
      delay : '0.51',
      delays: '0.44/0.01/0.05/0.01',
      dsn   : '2.0.0',
      status: 'sent (250 2.0.0 Ok: queued as 3mPVKl3YVXz2pS5Z)',
    },
  },
  {
    name: 'postfix/smtp, w/o angle brackets',
    line: 'Jul  5 06:52:11 prd-mx1 postfix/smtp[22030]: 3mPVKl0Mhjz7sXv: to=56597@continuity.delivery, relay=10.2.2.85[10.2.2.85]:2527, delay=0.51, delays=0.44/0.01/0.05/0.01, dsn=2.0.0, status=sent (250 2.0.0 Ok: queued as 3mPVKl3YVXz2pS5Z)',
    obj : {
      date  : 'Jul  5 06:52:11',
      host  : 'prd-mx1',
      prog  : 'postfix/smtp',
      pid   : '22030',
      qid   : '3mPVKl0Mhjz7sXv',
      to    :  '56597@continuity.delivery',
      relay : '10.2.2.85[10.2.2.85]:2527',
      delay : '0.51',
      delays: '0.44/0.01/0.05/0.01',
      dsn   : '2.0.0',
      status: 'sent (250 2.0.0 Ok: queued as 3mPVKl3YVXz2pS5Z)',
    },
  },
  {
    name: 'empty',
    line: '',
    obj : undefined,
  },
  {
    line: 'Jul  5 06:52:11 prd-mx1 postfix/smtp[22030]: 3mPVKl0Mhjz7sXv: to=<56597@con',
    name: 'truncated',
    obj : undefined,
  },
  {
    name: 'postfix/postsuper',
    line: 'Nov  6 01:01:03 mailq2 postfix/postsuper[1936]: 3nsRhm5bH5z306M: removed',
    obj : {
      date: 'Nov  6 01:01:03',
      host: 'mailq2',
      prog: 'postfix/postsuper',
      pid : '1936',
      msg : 'removed',
      qid : '3nsRhm5bH5z306M',
    },
  },
  {
    name: 'postfix/submission/smtpd',
    line: 'Nov 28 22:50:29 smtp postfix/submission/smtpd[70013]: 3p7RMT0zrYz20p: client=unknown[192.168.0.100], sasl_method=DIGEST-MD5, sasl_username=user@dmain.com',
    obj : {
      date         : 'Nov 28 22:50:29',
      host         : 'smtp',
      prog         : 'postfix/submission/smtpd',
      pid          : '70013',
      qid          : '3p7RMT0zrYz20p',
      client       : 'unknown[192.168.0.100]',
      sasl_method  : 'DIGEST-MD5',
      sasl_username: 'user@dmain.com',
    },
  },
]

describe('syslog lines', function () {
  context('asObject', function () {
    syslogLines.forEach(function (test) {
      it(test.name, function () {
        const res = re.asObject(test.line)
        assert.deepEqual(res, test.obj, util.inspect(res, { depth: null }))
      })
    })
  })
})

const postfixLines = [
  {
    line: '3mPVKl0Mhjz7sXv: to=<susan.bck@example.org>, relay=mpafm.example.org[24.100.200.21]:25, conn_use=2, delay=1.2, delays=0.76/0.01/0.09/0.34, dsn=2.0.0, status=sent (250 2.0.0 t5UI2nBt018923-t5UI2nBw018923 Message accepted for delivery)',
    type: 'postfix/smtp',
    desc: 'sent',
    obj : {
      qid     : '3mPVKl0Mhjz7sXv',
      to      : 'susan.bck@example.org',
      relay   : 'mpafm.example.org[24.100.200.21]:25',
      conn_use: '2',
      delay   : '1.2',
      delays  : '0.76/0.01/0.09/0.34',
      dsn     : '2.0.0',
      status  : 'sent (250 2.0.0 t5UI2nBt018923-t5UI2nBw018923 Message accepted for delivery)',
    },
  },
  {
    line: 'to=<susan.bck@example.org>, relay=mpafm.example.org[24.100.200.21]:25, conn_use=2, delay=1.2, delays=0.76/0.01/0.09/0.34, dsn=2.0.0, status=sent (250 2.0.0 t5UI2nBt018923-t5UI2nBw018923 Message accepted for delivery)',
    type: 'postfix/smtp',
    desc: 'sent w/o qid',
    obj : {
      to      : 'susan.bck@example.org',
      relay   : 'mpafm.example.org[24.100.200.21]:25',
      conn_use: '2',
      delay   : '1.2',
      delays  : '0.76/0.01/0.09/0.34',
      dsn     : '2.0.0',
      status  : 'sent (250 2.0.0 t5UI2nBt018923-t5UI2nBw018923 Message accepted for delivery)',
    },
  },
  {
    line: '3mPVKl0Mhjz7sXv: to=<jpayne@recipient.com>, relay=mail2.sender.com[66.100.32.07]:25, conn_use=2, delay=2.5, delays=1.6/0.01/0.08/0.81, dsn=5.7.1, status=bounced (host mail2.sender.com[66.100.32.07] said: 550 5.7.1 Unable to deliver to <jpayne@recipient.com> (in reply to RCPT TO command))',
    type: 'postfix/smtp',
    desc: 'bounced',
    obj : {
      qid     : '3mPVKl0Mhjz7sXv',
      to      : 'jpayne@recipient.com',
      relay   : 'mail2.sender.com[66.100.32.07]:25',
      conn_use: '2',
      delay   : '2.5',
      delays  : '1.6/0.01/0.08/0.81',
      dsn     : '5.7.1',
      status  : 'bounced (host mail2.sender.com[66.100.32.07] said: 550 5.7.1 Unable to deliver to <jpayne@recipient.com> (in reply to RCPT TO command))',
    },
  },
  {
    line: '3mPVKl0Mhjz7sXv: to=<rdunn@example.com>, relay=mailout.example.com[199.200.300.131]:25, conn_use=3, delay=2.3, delays=0.55/0/0.08/1.6, dsn=2.6.0, status=sent (250 2.6.0 message received)',
    type: 'postfix/smtp',
    desc: 'sent',
    obj : {
      qid     : '3mPVKl0Mhjz7sXv',
      to      : 'rdunn@example.com',
      relay   : 'mailout.example.com[199.200.300.131]:25',
      conn_use: '3',
      delay   : '2.3',
      delays  : '0.55/0/0.08/1.6',
      dsn     : '2.6.0',
      status  : 'sent (250 2.6.0 message received)',
    },
  },
  {
    line: '3mPVKl0Mhjz7sXv: to=<health-example-ahslott=foo.com@bar.com>, relay=none, delay=55175, delays=55144/0.05/30/0, dsn=4.4.1, status=deferred (connect to dc-452452f6.bar.com[63.200.300.49]:25: Connection timed out)',
    type: 'postfix/smtp',
    desc: 'deferred',
    obj : {
      qid   : '3mPVKl0Mhjz7sXv',
      to    : 'health-example-ahslott=foo.com@bar.com',
      relay : 'none',
      delay : '55175',
      delays: '55144/0.05/30/0',
      dsn   : '4.4.1',
      status: 'deferred (connect to dc-452452f6.bar.com[63.200.300.49]:25: Connection timed out)',
    },
  },
  {
    line: '3mPVKl0Mhjz7sXv: to=<rob@example.com>, relay=mailfilter.example-dom.com[63.200.2.118]:25, conn_use=2, delay=4.4, delays=2/2.2/0.02/0.14, dsn=2.0.0, status=sent (250 ok: Message 7295650 accepted)',
    type: 'postfix/smtp',
    obj : {
      qid     : '3mPVKl0Mhjz7sXv',
      to      : 'rob@example.com',
      relay   : 'mailfilter.example-dom.com[63.200.2.118]:25',
      conn_use: '2',
      delay   : '4.4',
      delays  : '2/2.2/0.02/0.14',
      dsn     : '2.0.0',
      status  : 'sent (250 ok: Message 7295650 accepted)',
    },
  },
  {
    line: '3mPVKl0Mhjz7sXv: to=<56750@continuity.delivery>, relay=10.2.2.85[10.2.2.85]:2527, delay=1.1, delays=1/0.01/0.04/0.05, dsn=2.0.0, status=sent (250 2.0.0 Ok: queued as 3mKPTL0WpJz45Shm)',
    type: 'postfix/smtp',
    desc: 'continuity',
    obj : {
      qid   : '3mPVKl0Mhjz7sXv',
      to    : '56750@continuity.delivery',
      relay : '10.2.2.85[10.2.2.85]:2527',
      delay : '1.1',
      delays: '1/0.01/0.04/0.05',
      dsn   : '2.0.0',
      status: 'sent (250 2.0.0 Ok: queued as 3mKPTL0WpJz45Shm)',
    },
  },
  {
    line: 'connect to mail.mountaineer.k12.mm.us[70.200.138.252]:25: Connection timed out',
    type: 'postfix/smtp',
    desc: 'error',
    obj : {
      action: 'delivery',
      mx    : 'mail.mountaineer.k12.mm.us[70.200.138.252]:25',
      err   : 'Connection timed out',
    },
  },
  {
    line: '3mhh843cz2zCpsL: enabling PIX workarounds: disable_esmtp delay_dotcrlf for 69.146.200.300[69.146.200.300]:25',
    type: 'postfix/smtp',
    desc: 'debug, PIX workarounds',
    obj : {
      qid: '3mhh843cz2zCpsL',
      msg: 'enabling PIX workarounds',
    },
  },
  {
    line: '3mPz615lB2z7sZt: Cannot start TLS: handshake failure',
    type: 'postfix/smtp',
    desc: 'debug, TLS handshake failure',
    obj : {
      qid: '3mPz615lB2z7sZt',
      msg: 'Cannot start TLS: handshake failure',
    },
  },
  {
    line: '3mNGjj1hQsz7sXh: lost connection with email.bar.com.foo.psmtp.com[64.300.200.26] while sending DATA command',
    type: 'postfix/smtp',
    desc: 'debug, lost connection',
    obj : {
      qid: '3mNGjj1hQsz7sXh',
      msg: 'lost connection with email.bar.com.foo.psmtp.com[64.300.200.26] while sending DATA command',
    },
  },
  {
    line: 'connect to gmail-smtp-in.l.google.com[2607:f8b0:4002:c06::1a]:25: Network is unreachable',
    type: 'postfix/smtp',
    desc: 'debug, network unreachable',
    obj : {
      action: 'delivery',
      mx    : 'gmail-smtp-in.l.google.com[2607:f8b0:4002:c06::1a]:25',
      err   : 'Network is unreachable',
    },
  },
  {
    line: 'SSL_connect error to 64.200.28.300[64.200.28.300]:25: lost connection',
    type: 'postfix/smtp',
    desc: 'debug, SSL_connect',
    obj : {
      msg: 'SSL_connect error to 64.200.28.300[64.200.28.300]:25: lost connection',
    },
  },
  {
    line: 'warning: numeric domain name in resource data of MX record for mail5.sportsmansguide.com: 207.67.19.85',
    type: 'postfix/smtp',
    desc: 'debug, numeric domain name',
    obj : {
      msg: 'warning: numeric domain name in resource data of MX record for mail5.sportsmansguide.com: 207.67.19.85',
    },
  },
  {
    line: 'warning: TLS library problem: error:14082174:SSL routines:SSL3_CHECK_CERT_AND_ALGORITHM:dh key too small:s3_clnt.c:3347:',
    type: 'postfix/smtp',
    desc: 'debug, TLS problem',
    obj : {
      msg: 'warning: TLS library problem: error:14082174:SSL routines:SSL3_CHECK_CERT_AND_ALGORITHM:dh key too small:s3_clnt.c:3347:',
    },
  },
  {
    line: 'warning: valid_hostname: invalid character 92(decimal): 1\\032ASPMX.L.GOOGLE.com',
    type: 'postfix/smtp',
    desc: 'debug, invalid char',
    obj : {
      msg: 'warning: valid_hostname: invalid character 92(decimal): 1\\032ASPMX.L.GOOGLE.com',
    },
  },
  {
    line: '3mQvyg5v2rz7sWq: host forward20.example.com[216.200.106.61] said: 450 4.7.1 <sam@example.com>: Recipient address rejected: Greylisted for 20 minutes (in reply to RCPT TO command)',
    type: 'postfix/smtp',
    desc: 'deferral, greylisted',
    obj : {
      qid   : '3mQvyg5v2rz7sWq',
      action: 'defer',
      host  : 'forward20.example.com[216.200.106.61]',
      msg   : '450 4.7.1 <sam@example.com>: Recipient address rejected: Greylisted for 20 minutes (in reply to RCPT TO command)',
    },
  },
  {
    line: '3mQysW0hLfz7sX5: host boing001.topica.com[66.227.60.140] said: 451 qq write error or disk full (#4.3.0) (in reply to end of DATA command)',
    type: 'postfix/smtp',
    desc: 'deferral, disk full',
    obj : {
      qid   : '3mQysW0hLfz7sX5',
      action: 'defer',
      host  : 'boing001.topica.com[66.227.60.140]',
      msg   : '451 qq write error or disk full (#4.3.0) (in reply to end of DATA command)',
    },
  },
  {
    line: '3mR69k6Fm0z7sX4: host smtp2.hiltonhhonors.net[159.127.185.42] refused to talk to me: 554-smtp2.hiltonhhonors.net 554 Your access to this mail system has been rejected due to the sending MTA\'s poor reputation. If you believe that this failure is in error, please contact the intended recipient via alternate means.',
    type: 'postfix/smtp',
    desc: 'reject',
    obj : {
      qid   : '3mR69k6Fm0z7sX4',
      action: 'reject',
      host  : 'smtp2.hiltonhhonors.net[159.127.185.42]',
      msg   : '554-smtp2.hiltonhhonors.net 554 Your access to this mail system has been rejected due to the sending MTA\'s poor reputation. If you believe that this failure is in error, please contact the intended recipient via alternate means.',
    },
  },
  {
    line: '3mS03L6qGtz7sVr: host mx1-us1.ppe-hosted.com[67.231.154.163] refused to talk to me: 421 4.3.2 All screening ports are busy',
    type: 'postfix/smtp',
    desc: 'defer',
    obj : {
      qid   : '3mS03L6qGtz7sVr',
      action: 'defer',
      host  : 'mx1-us1.ppe-hosted.com[67.231.154.163]',
      msg   : '421 4.3.2 All screening ports are busy',
    },
  },
  {
    line: '3mRyTc5Y5Nz7sXc: conversation with smtpb.mail.medcity.net[199.91.36.34] timed out while receiving the initial server greeting',
    type: 'postfix/smtp',
    desc: 'defer, timed out',
    obj : {
      qid   : '3mRyTc5Y5Nz7sXc',
      action: 'defer',
      host  : 'smtpb.mail.medcity.net[199.91.36.34]',
      msg   : 'while receiving the initial server greeting',
    },
  },
  {
    line: '3mKxs35RQsz7sXF: message-id=<3mKxs308vpz7sXd@mx14.example.net>',
    type: 'postfix/cleanup',
    desc: 'message-id',
    obj : {
      qid         : '3mKxs35RQsz7sXF',
      'message-id': '3mKxs308vpz7sXd@mx14.example.net',
    },
  },
  {
    line: 'message-id=<3mKxs308vpz7sXd@mx14.example.net>',
    type: 'postfix/cleanup',
    desc: 'message-id w/o queue ID',
    obj : {
      'message-id': '3mKxs308vpz7sXd@mx14.example.net',
    },
  },
  {
    line: '3mL1Hq0Tgvz7sWh: resent-message-id=<3mL1Hq0Tgvz7sWh@mx14.example.net>',
    type: 'postfix/cleanup',
    desc: 'resent-message-id',
    obj : {
      qid                : '3mL1Hq0Tgvz7sWh',
      'resent-message-id': '3mL1Hq0Tgvz7sWh@mx14.example.net',
    },
  },
  {
    line: '3mgs0P5v1lz7sh1: resent-message-id=<DM2PR0801MB602DCC95DD755B7E98634E0EE8D0@DM2PR0801MB602.namp',
    type: 'postfix/cleanup',
    desc: 'resent-message-id truncated',
    obj : {
      qid                : '3mgs0P5v1lz7sh1',
      'resent-message-id': 'DM2PR0801MB602DCC95DD755B7E98634E0EE8D0@DM2PR0801MB602.namp',
    },
  },
  {
    line: '3mKxs308vpz7sXd: uid=1206 from=<system>',
    type: 'postfix/pickup',
    desc: '',
    obj : {
      qid : '3mKxs308vpz7sXd',
      uid : '1206',
      from: 'system',
    },
  },
  {
    line: 'uid=1206 from=<system>',
    type: 'postfix/pickup',
    desc: 'w/o queue ID',
    obj : {
      uid : '1206',
      from: 'system',
    },
  },
  {
    line: 'warning: 3mCqcj5HR1z2xDW: message has been queued for 2 days',
    type: 'postfix/pickup',
    desc: '2 day warning',
    obj : {
      qid: '3mCqcj5HR1z2xDW',
      msg: 'message has been queued for 2 days',
    },
  },
  {
    line: '3mJddz5fh3z7sdM: to=<rcarey@example.tv>, relay=none, delay=165276, delays=165276/0.09/0/0.09, dsn=4.4.1, status=deferred (delivery temporarily suspended: connect to 24.200.177.247[24.200.177.247]:25: Connection timed out)',
    type: 'postfix/error',
    desc: '',
    obj : {
      qid   : '3mJddz5fh3z7sdM',
      to    : 'rcarey@example.tv',
      relay : 'none',
      delay : '165276',
      delays: '165276/0.09/0/0.09',
      dsn   : '4.4.1',
      status: 'deferred (delivery temporarily suspended: connect to 24.200.177.247[24.200.177.247]:25: Connection timed out)',
    },
  },
  {
    line: 'to=<rcarey@example.tv>, relay=none, delay=165276, delays=165276/0.09/0/0.09, dsn=4.4.1, status=deferred (delivery temporarily suspended: connect to 24.200.177.247[24.200.177.247]:25: Connection timed out)',
    type: 'postfix/error',
    desc: 'w/o queue ID',
    obj : {
      to    : 'rcarey@example.tv',
      relay : 'none',
      delay : '165276',
      delays: '165276/0.09/0/0.09',
      dsn   : '4.4.1',
      status: 'deferred (delivery temporarily suspended: connect to 24.200.177.247[24.200.177.247]:25: Connection timed out)',
    },
  },
  {
    line: 'warning: 3lyw1l0Nwdz2xGs: defer service failure',
    type: 'postfix/error',
    desc: 'warning, service failure',
    obj : {
      qid: '3lyw1l0Nwdz2xGs',
      msg: 'defer service failure',
    },
  },
  {
    line: '3mLQKH6hqhz7sWK: to=<logspam@system.alerts>, relay=local, delay=3.1, delays=1.8/0.86/0/0.44, dsn=2.0.0, status=sent (forwarded as 3mLQKK4rDdz7sVS)',
    type: 'postfix/local',
    desc: '',
    obj : {
      qid        : '3mLQKH6hqhz7sWK',
      to         : 'logspam@system.alerts',
      relay      : 'local',
      delay      : '3.1',
      delays     : '1.8/0.86/0/0.44',
      dsn        : '2.0.0',
      status     : 'forwarded',
      forwardedAs: '3mLQKK4rDdz7sVS',
    },
  },
  {
    line: 'to=<logspam@system.alerts>, relay=local, delay=3.1, delays=1.8/0.86/0/0.44, dsn=2.0.0, status=sent (forwarded as 3mLQKK4rDdz7sVS)',
    type: 'postfix/local',
    desc: 'w/o queue ID',
    obj : {
      to         : 'logspam@system.alerts',
      relay      : 'local',
      delay      : '3.1',
      delays     : '1.8/0.86/0/0.44',
      dsn        : '2.0.0',
      status     : 'forwarded',
      forwardedAs: '3mLQKK4rDdz7sVS',
    },
  },
  {
    line: '486ED600A5: to=<system@prd.slc.example.net>, orig_to=<system>, relay=local, delay=0.01, delays=0.01/0/0/0, dsn=2.0.0, status=sent (delivered to mailbox)',
    type: 'postfix/local',
    desc: 'short qid',
    obj : {
      qid    : '486ED600A5',
      to     : 'system@prd.slc.example.net',
      orig_to: 'system',
      relay  : 'local',
      delay  : '0.01',
      delays : '0.01/0/0/0',
      dsn    : '2.0.0',
      status : 'sent (delivered to mailbox)',
    },
  },
  {
    line: '3mKxY750hmz7scK: sender non-delivery notification: 3mKxYH0vl4z7sWS',
    type: 'postfix/bounce',
    desc: '',
    obj : {
      qid   : '3mKxY750hmz7scK',
      dsnQid: '3mKxYH0vl4z7sWS',
    },
  },
  {
    line: 'sender non-delivery notification: 3mKxYH0vl4z7sWS',
    type: 'postfix/bounce',
    desc: 'w/o queue ID',
    obj : {
      dsnQid: '3mKxYH0vl4z7sWS',
    },
  },
  {
    line: 'fatal: append file defer 3lyw0Z2NdSz2xGb: No space left on device',
    type: 'postfix/bounce',
    desc: 'fatal, disk full',
    obj : {
      qid: '3lyw0Z2NdSz2xGb',
      msg: 'fatal: append file defer: No space left on device',
    },
  },
  {
    line: '3mKnNK1XhXz7sgL: from=<spruit@example.org>, size=11445, nrcpt=1 (queue active)',
    type: 'postfix/qmgr',
    desc: 'from',
    obj : {
      qid  : '3mKnNK1XhXz7sgL',
      from : 'spruit@example.org',
      size : '11445',
      nrcpt: '1',
    },
  },
  {
    line: '3mfNtc147Bz1M9pl: from=<e13f0bfb.ged.hd0.23.hjdjln+lugoe=maevolen.com@bnc.mailjet.com>, size=79660, nrcpt=1 (queue active)',
    type: 'postfix/qmgr',
    desc: 'from',
    obj : {
      qid  : '3mfNtc147Bz1M9pl',
      from : 'e13f0bfb.ged.hd0.23.hjdjln+lugoe=maevolen.com@bnc.mailjet.com',
      size : '79660',
      nrcpt: '1',
    },
  },
  {
    line: 'from=<spruit@example.org>, size=11445, nrcpt=1 (queue active)',
    type: 'postfix/qmgr',
    desc: 'from w/o queue ID',
    obj : {
      from : 'spruit@example.org',
      size : '11445',
      nrcpt: '1',
    },
  },
  {
    line: '3l8L6X6lCPz7t2M: from=<deedee@example.com>, status=expired, returned to sender',
    type: 'postfix/qmgr',
    desc: 'expired',
    obj : {
      qid   : '3l8L6X6lCPz7t2M',
      from  : 'deedee@example.com',
      status: 'expired, returned to sender',
    },
  },
  {
    line: '3mfHGL1r9gzyQP: from=<system>, size=813, nrcpt=1 (queue active)',
    type: 'postfix/qmgr',
    desc: 'newlkajd;fkjasd;flkjaskdfj',
    obj : {
      qid  : '3mfHGL1r9gzyQP',
      from : 'system',
      size : '813',
      nrcpt: '1',
    },
  },
  {
    line: '3l8L6X6lCPz7t2M: removed',
    type: 'postfix/qmgr',
    desc: 'removed',
    obj : {
      qid: '3l8L6X6lCPz7t2M',
      msg: 'removed',
    },
  },
  {
    line: 'statistics: domain lookup hits=0 miss=3 success=0%',
    type: 'postfix/scache',
    desc: '',
    obj : {
      statistics: 'domain lookup hits=0 miss=3 success=0%',
    },
  },
  {
    line: 'WHITELISTED [10.2.2.91]:56553',
    type: 'postfix/postscreen',
    desc: '',
    obj : {
      postscreen: 'WHITELISTED [10.2.2.91]:56553',
    },
  },
  {
    line: '',
    type: 'empty',
    desc: 'empty args, empty result',
    obj : undefined,
  },
  {
    line: 'Jul  5 06:52:11 prd-mx1 postfix/cleanup[21893]: 3mPVKl0Mhjz7sXv: message-id=<E1ZB06G-0006n5-Vp@anc-dev-web1.slc.example.net>',
    type: 'syslog',
    desc: '',
    obj : {
      date: 'Jul  5 06:52:11',
      host: 'prd-mx1',
      prog: 'postfix/cleanup',
      pid : '21893',
      msg : '3mPVKl0Mhjz7sXv: message-id=<E1ZB06G-0006n5-Vp@anc-dev-web1.slc.example.net>',
    },
  },
  {
    line: 'Jul  5 06:52:11 prd-mx1 postfix/smtp[22030]: 3mPVKl0Mhjz7sXv: to=<56597@con',
    type: 'postfix/smtp',
    desc: 'truncated',
    obj : undefined,
  },
  {
    line: '3nsRhm5bH5z306M: removed',
    type: 'postfix/postsuper',
    desc: 'deletion from queue/quarantine',
    obj : {
      qid: '3nsRhm5bH5z306M',
      msg: 'removed',
    },
  },
  {
    line: '3nsF2M5j0nz31GS: released from hold',
    type: 'postfix/postsuper',
    desc: 'release from quarantine',
    obj : {
      qid: '3nsF2M5j0nz31GS',
      msg: 'released from hold',
    },
  },
  {
    line: 'Jan 6 08:39:06 mail postfix/smtpd[339505]: 93C8388C38: client=unknown[192.168.1.0]',
    type: 'syslog',
    desc: 'postfix/smtpd',
    obj : {
      'date': 'Jan 6 08:39:06',
      'host': 'mail',
      'msg' : '93C8388C38: client=unknown[192.168.1.0]',
      'pid' : '339505',
      'prog': 'postfix/smtpd',
    },
  },
  {
    line: 'Jan 6 08:39:06 mail postfix/smtpd[339505]: disconnect from unknown[192.168.1.0] ehlo=1 mail=1 rcpt=1 data=1 quit=1',
    type: 'syslog',
    desc: 'postfix/smtpd disconnect',
    obj : {
      'date': 'Jan 6 08:39:06',
      'host': 'mail',
      'msg' : 'disconnect from unknown[192.168.1.0] ehlo=1 mail=1 rcpt=1 data=1 quit=1',
      'pid' : '339505',
      'prog': 'postfix/smtpd',
    },
  },
  {
    line: 'Jan 6 08:39:49 mail postfix/smtpd[339505]: connect from localhost[127.0.0.1]',
    type: 'syslog',
    desc: 'postfix/smtpd connect',
    obj : {
      'date': 'Jan 6 08:39:49',
      'host': 'mail',
      'msg' : 'connect from localhost[127.0.0.1]',
      'pid' : '339505',
      'prog': 'postfix/smtpd',
    },
  },
]

describe('postfix lines', function () {
  describe('asObjectType', function () {
    for (const test of postfixLines) {
      it(test.type + (test.desc ? ' ' + test.desc : ''), function () {
        const res = re.asObjectType(test.type, test.line)
        assert.deepEqual(res, test.obj) // , util.inspect(res, {depth: null}));
      })
    }
  })
})
