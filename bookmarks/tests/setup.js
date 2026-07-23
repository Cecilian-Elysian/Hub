import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export function mockGM() {
  const store = {}
  globalThis.window = globalThis
  globalThis.GM_getValue = (key, def) => (key in store ? store[key] : def)
  globalThis.GM_setValue = (key, val) => { store[key] = val }
  globalThis.GM_deleteValue = (key) => { delete store[key] }
  globalThis.GM_listValues = () => Object.keys(store)
  globalThis.GM_log = () => {}
  globalThis.GM_notification = () => {}
  globalThis.GM_openInTab = () => {}
  globalThis.GM_setClipboard = () => {}
  globalThis.GM_download = () => {}
  globalThis.GM_registerMenuCommand = () => {}
  globalThis.GM_addValueChangeListener = () => 0
  globalThis.GM_removeValueChangeListener = () => {}
  globalThis.confirm = () => true
  globalThis.FileReader = class { readAsText() {} }
  globalThis.alert = () => {}
  globalThis.location = { protocol: 'http:' }
  globalThis.document = { addEventListener() {}, removeEventListener() {}, head: {}, body: {} }
}

export function loadBuilt() {
  const code = readFileSync(join(__dirname, '..', 'dist', 'bookmarks.user.js'), 'utf-8')
  const fn = new Function('window', 'globalThis', code)
  fn(globalThis, globalThis)
  if (!globalThis.BookmarkLogger) {
    throw new Error('BookmarkLogger namespace not found after loading built script')
  }
}