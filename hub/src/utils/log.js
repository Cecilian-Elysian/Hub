;(function(ns) {

const TAG = '[CatHub]'

function _emit(level, args, consoleFn, gmLevel) {
  const msg = TAG + ' ' + args.map(a => {
    if (a === null) return 'null'
    if (a === undefined) return 'undefined'
    if (typeof a === 'string') return a
    if (a instanceof Error) return a.message + (a.stack ? '\n' + a.stack : '')
    try { return JSON.stringify(a) } catch (e) { return String(a) }
  }).join(' ')
  try {
    if (typeof console !== 'undefined' && console[consoleFn]) {
      console[consoleFn](msg)
    }
  } catch (e) {}
  try {
    if (typeof GM_log === 'function') {
      GM_log(msg, gmLevel)
    }
  } catch (e) {}
}

const log = {
  info: (...args) => _emit('info', args, 'log', 'info'),
  warn: (...args) => _emit('warn', args, 'warn', 'warn'),
  error: (...args) => _emit('error', args, 'error', 'error'),
  debug: (...args) => {
    try {
      if (typeof GM_getValue === 'function' && GM_getValue('debug-mode', false)) {
        _emit('debug', args, 'log', 'debug')
      }
    } catch (e) {}
  },
}

ns.log = log

})(CatHub)