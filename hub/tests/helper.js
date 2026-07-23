import vm from 'node:vm'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SRC_DIR = path.resolve(__dirname, '../src')

export function loadHub(relativePaths = []) {
  let code = ''
  for (const p of relativePaths) {
    code += fs.readFileSync(path.join(SRC_DIR, p), 'utf-8') + '\n'
  }
  vm.runInThisContext(code)
  return globalThis.CatHub
}

function createMockWindow() {
  const listeners = {}
  return {
    _listeners: listeners,
    addEventListener(type, fn) {
      if (!listeners[type]) listeners[type] = []
      listeners[type].push(fn)
    },
    removeEventListener(type, fn) {
      if (!listeners[type]) return
      listeners[type] = listeners[type].filter(f => f !== fn)
    },
    dispatchEvent(evt) {
      const type = (evt && evt.type) || ''
      const list = listeners[type] || []
      for (const fn of list) {
        try { fn(evt) } catch (e) {}
      }
      return true
    },
  }
}

export function loadHubCode(relativePaths) {
  let code = ''
  for (const p of relativePaths) {
    code += fs.readFileSync(path.join(SRC_DIR, p), 'utf-8') + '\n'
  }
  return code
}

export function runWithSandbox(relativePaths, bodyFn) {
  const code = loadHubCode(relativePaths)
  const store = {}
  const sandbox = {
    window: createMockWindow(),
    document: { hidden: false, addEventListener: () => {}, removeEventListener: () => {} },
    GM_getValue: (k, d) => (k in store ? store[k] : d),
    GM_setValue: (k, v) => { store[k] = v },
    GM_deleteValue: (k) => { if (k in store) { delete store[k]; return true } return false },
    GM_notification: () => {},
    GM_openInTab: () => {},
    GM_registerMenuCommand: () => {},
    GM_log: () => {},
    console: { log: () => {}, warn: () => {}, error: () => {} },
    setTimeout, clearTimeout, setInterval, clearInterval,
    CustomEvent: class CustomEvent {
      constructor(type, init) { this.type = type; this.detail = init && init.detail }
    },
    Date, JSON, Object, Array, Map, Set, Promise,
    Math, Error, RegExp, Number, String, Boolean,
  }
  sandbox.CatHub = {}
  sandbox.globalThis = sandbox
  sandbox.self = sandbox
  vm.createContext(sandbox)
  const wrapped = '(function() {\nvar CatHub = globalThis.CatHub;\n' + code + '\nglobalThis._result = (function() {\n' + bodyFn + '\n})()\n})()'
  vm.runInContext(wrapped, sandbox)
  return sandbox
}