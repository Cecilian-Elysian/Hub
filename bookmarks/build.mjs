import { readFileSync, writeFileSync, rmSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const HEADER = `// ==UserScript==
// @name         网址收藏 BookmarkLogger
// @namespace    https://github.com/Cecilian-Elysian/bookmarks
// @version      0.2.0
// @description  导入浏览器收藏书签，搜索筛选后导出为 Markdown / JSON / 标准书签 HTML（Hub 兼容）
// @author       Cecilian-Elysian
// @match        *://*/*
// @run-at       document-idle
// @storageName  bookmarks-logger
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_log
// @grant        GM_notification
// @grant        GM_openInTab
// @grant        GM_registerMenuCommand
// @grant        GM_setClipboard
// @grant        GM_download
// @grant        GM_addValueChangeListener
// @grant        GM_removeValueChangeListener
// @grant        unsafeWindow
// @license      MIT
// ==/UserScript==
`

const FILES = [
  'src/namespace.js',
  'src/constants.js',
  'src/config.js',
  'src/core/dedup.js',
  'src/core/parser.js',
  'src/core/storage.js',
  'src/utils/format.js',
  'src/utils/notify.js',
  'src/hub-compat.js',
  'src/ui/floating-btn.js',
  'src/ui/panel.js',
  'src/entry/ui.js',
]

const KNOWN_GLOBALS = new Set([
  'Object', 'Array', 'String', 'Number', 'Boolean', 'Function', 'Date',
  'RegExp', 'Error', 'Map', 'Set', 'WeakMap', 'WeakSet', 'Promise',
  'Math', 'JSON', 'parseInt', 'parseFloat', 'isNaN', 'isFinite',
  'encodeURI', 'encodeURIComponent', 'decodeURI', 'decodeURIComponent',
  'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval',
  'console', 'location', 'window', 'document', 'CustomEvent',
  'GM_getValue', 'GM_setValue', 'GM_deleteValue', 'GM_listValues',
  'GM_xmlhttpRequest', 'GM_notification', 'GM_openInTab',
  'GM_setClipboard', 'GM_download', 'GM_log',
  'GM_addValueChangeListener', 'GM_removeValueChangeListener',
  'GM_registerMenuCommand', 'GM_addStyle', 'GM_info', 'unsafeWindow',
  'confirm', 'FileReader', 'alert',
])

function validateFileList(fileList, label) {
  const errors = []
  for (const f of fileList) {
    if (!existsSync(join(__dirname, f))) {
      errors.push(`  ${f}`)
    }
  }
  if (errors.length > 0) {
    console.error(`❌ [${label}] Missing files:`)
    errors.forEach(e => console.error(e))
    process.exit(1)
  }
}

function checkSyntax(code, label) {
  try {
    new Function(code)
  } catch (e) {
    const m = e.message || String(e)
    const line = m.match(/line (\d+)/)
    console.error(`❌ [${label}] Syntax error${line ? ` (line ${line[1]})` : ''}: ${m}`)
    process.exit(1)
  }
}

function extractDefinitions(code) {
  const defs = new Set()
  const patterns = [
    /function\s+(\w+)\s*\(/g,
    /class\s+(\w+)/g,
    /(?:const|let|var)\s+(\w+)\s*=/g,
  ]
  for (const re of patterns) {
    let m
    while ((m = re.exec(code)) !== null) {
      defs.add(m[1])
    }
  }
  return defs
}

const JS_KEYWORDS = new Set([
  'function', 'class', 'const', 'let', 'var', 'if', 'else', 'for', 'while',
  'do', 'switch', 'case', 'break', 'continue', 'return', 'throw', 'try',
  'catch', 'finally', 'new', 'delete', 'typeof', 'instanceof', 'in', 'of',
  'this', 'super', 'yield', 'await', 'async', 'import', 'export', 'from',
  'extends', 'static', 'get', 'set',
])

const JS_RESERVED = new Set([
  'undefined', 'null', 'true', 'false', 'NaN', 'Infinity',
  'constructor', 'prototype', 'hasOwnProperty', 'toString', 'valueOf',
  'then', 'catch', 'finally',
])

function checkUndefinedReferences(code, label) {
  const callPattern = /(?<![.\w$])([A-Za-z_$]\w*)\s*\(/g
  const used = new Set()
  let m
  while ((m = callPattern.exec(code)) !== null) {
    used.add(m[1])
  }
  const defined = extractDefinitions(code)
  const missing = []
  for (const name of used) {
    if (!defined.has(name) && !KNOWN_GLOBALS.has(name) &&
        !JS_KEYWORDS.has(name) && !JS_RESERVED.has(name) &&
        !name.startsWith('_') && name === name.toLowerCase() &&
        !/^(on|_)/.test(name) && name.length > 1) {
      missing.push(name)
    }
  }
  if (missing.length > 0) {
    console.warn(`⚠️  [${label}] Possibly undefined references: ${missing.join(', ')}`)
    console.warn(`   (these may be false positives; verify manually)`)
  }
}

function build() {
  try { rmSync(join(__dirname, 'dist', 'bookmarks.user.js')) } catch (e) {}

  console.log('Validating file list...')
  validateFileList(FILES, 'bookmarks')

  console.log('Building script...')
  const body = concatFiles(FILES)
  const out = HEADER + '\n' + body
  checkSyntax(out, 'bookmarks')
  checkUndefinedReferences(body, 'bookmarks')

  const outPath = join(__dirname, 'dist', 'bookmarks.user.js')
  writeFileSync(outPath, out, 'utf-8')

  const size = (out.length / 1024).toFixed(1)
  console.log(`✅ Built: ${outPath} (${size} KB)`)
}

function concatFiles(fileList) {
  const parts = []
  for (const f of fileList) {
    const content = readFileSync(join(__dirname, f), 'utf-8').trim()
    parts.push(`// === ${f} ===`)
    parts.push(content)
    parts.push('')
  }
  return parts.join('\n')
}

build()