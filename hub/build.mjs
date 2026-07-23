import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const HEADER = `// ==UserScript==
// @name         Cecilian 脚本集 CatHub
// @namespace    https://github.com/Cecilian-Elysian/hub
// @version      0.1.0
// @description  Cecilian 家族脚本的统一入口，自动发现已安装的脚本并提供聚合面板
// @author       Cecilian-Elysian
// @match        *://*/*
// @run-at       document-idle
// @storageName  cat-hub
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_listValues
// @grant        GM_notification
// @grant        GM_openInTab
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// @grant        GM_log
// @license      MIT
// ==/UserScript==
`

const FILE_LIST = [
  'src/namespace.js',
  'src/constants.js',
  'src/config.js',
  'src/registry.js',
  'src/utils/log.js',
  'src/utils/format.js',
  'src/utils/notify.js',
  'src/utils/hotkey.js',
  'src/icons/lucide.js',
  'src/core/storage.js',
  'src/core/takeover.js',
  'src/core/detector.js',
  'src/core/badge.js',
  'src/core/listener.js',
  'src/ui/floating-btn.js',
  'src/ui/script-card.js',
  'src/ui/panel.js',
  'src/entry/ui.js',
]

const KNOWN_GLOBALS = new Set([
  'Object', 'Array', 'String', 'Number', 'Boolean', 'Function', 'Date',
  'RegExp', 'Error', 'Map', 'Set', 'WeakMap', 'WeakSet', 'Promise',
  'Math', 'JSON', 'parseInt', 'parseFloat', 'isNaN', 'isFinite',
  'encodeURI', 'encodeURIComponent', 'decodeURI', 'decodeURIComponent',
  'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval',
  'requestAnimationFrame', 'console', 'location', 'window', 'document',
  'CustomEvent', 'confirm',
  'GM_getValue', 'GM_setValue', 'GM_deleteValue', 'GM_listValues',
  'GM_notification', 'GM_openInTab', 'GM_registerMenuCommand',
  'GM_addStyle', 'GM_log', 'GM_info', 'unsafeWindow',
])

const JS_RESERVED = new Set([
  'undefined', 'null', 'true', 'false', 'NaN', 'Infinity',
  'constructor', 'prototype', 'hasOwnProperty', 'toString', 'valueOf',
  'then', 'catch', 'finally',
])

function validateFileList(fileList) {
  const errors = []
  for (const f of fileList) {
    if (!existsSync(join(__dirname, f))) errors.push('  ' + f)
  }
  if (errors.length > 0) {
    console.error('❌ Missing files:')
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
    console.error(`❌ [${label}] Syntax error${line ? ' (line ' + line[1] + ')' : ''}: ${m}`)
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
    while ((m = re.exec(code)) !== null) defs.add(m[1])
  }
  return defs
}

function checkUndefinedReferences(code, label) {
  const callPattern = /(?<![.\w$])([A-Za-z_$]\w*)\s*\(/g
  const used = new Set()
  let m
  while ((m = callPattern.exec(code)) !== null) used.add(m[1])
  const defined = extractDefinitions(code)
  const missing = []
  for (const name of used) {
    if (!defined.has(name) && !KNOWN_GLOBALS.has(name) && !JS_RESERVED.has(name) &&
        !name.startsWith('_') && name === name[0].toLowerCase() + name.slice(1) &&
        name.length > 1) {
      missing.push(name)
    }
  }
  if (missing.length > 0) {
    console.warn(`⚠️  [${label}] Possibly undefined references: ${missing.join(', ')}`)
    console.warn('   (these may be false positives; verify manually)')
  }
}

function concatFiles(fileList) {
  const parts = []
  for (const f of fileList) {
    const content = readFileSync(join(__dirname, f), 'utf-8').trim()
    parts.push('// === ' + f + ' ===')
    parts.push(content)
    parts.push('')
  }
  return parts.join('\n')
}

function build() {
  console.log('Validating file list...')
  validateFileList(FILE_LIST)

  console.log('Building hub.user.js...')
  const body = concatFiles(FILE_LIST)
  const output = HEADER + '\n' + body
  checkSyntax(output, 'hub')
  checkUndefinedReferences(body, 'hub')

  const outPath = join(__dirname, 'dist', 'hub.user.js')
  writeFileSync(outPath, output, 'utf-8')

  const size = (output.length / 1024).toFixed(1)
  console.log(`✅ Built: ${outPath} (${size} KB)`)

  if (size > 100) console.warn(`⚠️  Script is large (${size} KB) — consider code splitting`)
}

build()