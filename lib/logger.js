// this is a stub library. Overload/extend these functions with a more
// feature-filled or robust library.

exports.debug = msg => {
  if (!process.env.DEBUG) return
  console.log(msg)
}

exports.info = msg => {
  if (process.env.NODE_ENV === 'test') return // nice quiet tests
  console.log(msg)
}

exports.error = msg => {
  if (process.env.NODE_ENV === 'test') return
  console.error(msg)
}
