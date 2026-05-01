import * as logger from './lib/logger.js'

const envEmailAddr = '<?([^>,]*)>?'
const postfixQid = '[0-9A-F]{10,11}' // default queue ids
const postfixQidLong = '[0-9A-Za-z]{14,16}' // optional 'long' ids
const postfixQidAny = `${postfixQidLong}|${postfixQid}`

const regex = {
  syslog            : /^([A-Za-z]{3} [0-9 ]{1,2} [\d:]{8}) ([^\s]+) ([^[]+)\[([\d]+)\]: (.*)$/,
  'submission/smtpd': new RegExp(
    `^(?:(${
      postfixQidAny
    }): )?(client)=([^,]+), (sasl_method)=([^,]+), (sasl_username)=(.*)$`,
  ),
  smtp: new RegExp(
    `^(?:(${postfixQidAny}): )?(to)=${envEmailAddr}, (?:(orig_to)=${
      envEmailAddr
    }, )?(relay)=([^,]+), (?:(conn_use)=([0-9]+), )?(delay)=([^,]+), (delays)=([^,]+), (dsn)=([^,]+), (status)=(.*)$`,
  ),
  'smtp-defer': new RegExp(
    `^(?:(${
      postfixQidAny
    }): )?(?:host) ([^ ]+) (?:said|refused to talk to me): (4[0-9]{2} .*)$`,
  ),
  'smtp-timeout': new RegExp(
    `^(?:(${postfixQidAny}): )?conversation with ([^ ]+) timed out (.*)$`,
  ),
  'smtp-reject': new RegExp(
    `^(?:(${
      postfixQidAny
    }): )?host ([^ ]+) (?:said|refused to talk to me): (5[0-9]{2}.*)$`,
  ),
  'smtp-conn-err': /^connect to ([^ ]+): (.*)$/,
  'smtp-debug'   : new RegExp(
    `(?:(${
      postfixQidAny
    }): )?(enabling PIX workarounds|setting up TLS|Cannot start TLS: handshake failure|lost connection .*|^connect from .*|^disconnect from .*|^SSL_accept|^SSL_connect error to .*|^warning: .*|conversation with |host )`,
  ),
  qmgr: new RegExp(
    `^(?:(${postfixQidAny}): )?(from)=${
      envEmailAddr
    }, (?:(size)=([0-9]+), (nrcpt)=([0-9]+) |(status)=(.*)$)`,
  ),
  'qmgr-retry'  : new RegExp(`^(${postfixQidAny}): (removed)`),
  cleanup       : new RegExp(`^(?:(${postfixQidAny}): )?((?:resent-)?message-id)=<(.*?)>?$`),
  pickup        : new RegExp(`^(?:(${postfixQidAny}): )?(uid)=([0-9]+) (from)=${envEmailAddr}`),
  'pickup-retry': new RegExp(`^warning: (${postfixQidAny}): (.*)$`),
  error         : new RegExp(
    `^(?:(${postfixQidAny}): )?(to)=${envEmailAddr}, (?:(orig_to)=${
      envEmailAddr
    }, )?(relay)=([^,]+), (delay)=([^,]+), (delays)=([^,]+), (dsn)=([^,]+), (status)=(.*)$`,
  ),
  'error-retry': new RegExp(`^warning: (${postfixQidAny}): (.*)$`),
  bounce       : new RegExp(
    `^(?:(${
      postfixQidAny
    }): )?sender non-delivery notification: (${postfixQidAny}$)`,
  ),
  'bounce-fatal': new RegExp(`^fatal: (.*?) (${postfixQidAny}): (.*)$`),
  local         : new RegExp(
    `^(?:(${postfixQidAny}): )?(to)=${envEmailAddr}, (?:(orig_to)=${
      envEmailAddr
    }, )?(relay)=([^,]+), (delay)=([^,]+), (delays)=([^,]+), (dsn)=([^,]+), (status)=(sent .*)$`,
  ),
  forwardedAs: new RegExp(`forwarded as (${postfixQidAny})\\)`),
  scache     : new RegExp('^statistics: (.*)'),
  postscreen : new RegExp('^(.*)'),
  postsuper  : new RegExp(`^(${postfixQidAny}): (.*)$`),
}

export const asObject = line => {
  const match = line.match(regex.syslog)
  if (!match) {
    logger.error(`unparsable syslog: ${line}`)
    return
  }

  const syslog = syslogAsObject(match)
  if (!/^postfix/.test(syslog.prog)) return // not postfix, ignore

  const parsed = asObjectType(syslog.prog, syslog.msg)
  if (!parsed) {
    logger.error(`unparsable ${syslog.prog}: ${syslog.msg}`)
    return
  }

  const fields = [ 'date', 'host', 'prog', 'pid' ]
  fields
    .filter(field => syslog[field])
    .forEach(field => {
      parsed[field] = syslog[field]
    })

  return parsed
}

export const asObjectType = (type, line) => {
  if (!type || !line) {
    logger.error('missing required arg')
    return
  }
  if ('postfix/' === type.substring(0, 8)) type = type.substring(8)

  const directHandlers = {
    qmgr              : () => argAsObject(type, line),
    pickup            : () => argAsObject(type, line),
    error             : () => argAsObject(type, line),
    'submission/smtpd': () => argAsObject(type, line),
    smtp              : () => smtpAsObject(line),
    bounce            : () => bounceAsObject(line),
  }

  if (directHandlers[type]) return directHandlers[type]()

  const match = line.match(regex[type])
  if (!match) return

  const typeHandlers = {
    syslog    : () => syslogAsObject(match),
    scache    : () => ({ statistics: match[1] }),
    postscreen: () => ({ postscreen: match[1] }),
    local     : () => localAsObject(match),
    postsuper : () => ({ qid: match[1], msg: match[2] }),
  }

  return typeHandlers[type]?.() ?? matchAsObject(match)
}

const syslogAsObject = match => ({
  date: match[1],
  host: match[2],
  prog: match[3],
  pid : match[4],
  msg : match[5],
})

const matchAsObject = match => {
  const [ , ...pairs ] = match
  const obj = {}
  const qid = pairs.shift()
  if (qid) obj.qid = qid

  for (let i = 0; i < pairs.length; i += 2) {
    const [ key, val ] = pairs.slice(i, i + 2)
    if (key !== undefined && val !== undefined) {
      obj[key] = val
    }
  }
  return obj
}

const argAsObject = (thing, line) => {
  let match = line.match(regex[thing])
  if (match) return matchAsObject(match)

  match = line.match(regex[`${thing}-retry`])
  if (match) return { qid: match[1], msg: match[2] }
}

const smtpAsObject = line => {
  let match = line.match(regex.smtp)
  if (match) return matchAsObject(match)

  match = line.match(regex['smtp-conn-err'])
  if (match) {
    return {
      action: 'delivery',
      mx    : match[1],
      err   : match[2],
    }
  }

  match = line.match(regex['smtp-defer'])
  if (match) {
    return {
      action: 'defer',
      qid   : match[1],
      host  : match[2],
      msg   : match[3],
    }
  }

  match = line.match(regex['smtp-reject'])
  if (match) {
    return {
      action: 'reject',
      qid   : match[1],
      host  : match[2],
      msg   : match[3],
    }
  }

  match = line.match(regex['smtp-timeout'])
  if (match) {
    return {
      action: 'defer',
      qid   : match[1],
      host  : match[2],
      msg   : match[3],
    }
  }

  match = line.match(regex['smtp-debug'])
  if (!match) return
  const [ , qid, msg ] = match
  if (qid && msg) {
    return { qid, msg }
  }
  return { msg: match[0] }
}

const bounceAsObject = line => {
  let match = line.match(regex.bounce)
  if (match) {
    const [ , qid, dsnQid ] = match
    const obj = {}
    if (qid) obj.qid = qid
    if (dsnQid) obj.dsnQid = dsnQid
    return obj
  }

  match = line.match(regex['bounce-fatal'])
  if (match) {
    const [ , msg, qid, error ] = match
    return {
      qid,
      msg: `fatal: ${msg}: ${error}`,
    }
  }
}

const localAsObject = match => {
  const obj = matchAsObject(match)
  const m = obj.status?.match(regex.forwardedAs)
  if (m) {
    obj.status = 'forwarded'
    obj.forwardedAs = m[1]
  }
  return obj
}
