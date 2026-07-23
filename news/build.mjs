import { readFileSync, writeFileSync, rmSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const CORE_HEADER = `// ==UserScript==
// @name         新闻聚合核心 NewsAggregator Core
// @namespace    https://github.com/Cecilian-Elysian/news
// @version      0.2.0
// @description  后台新闻抓取引擎（常驻抓取、去重、周报）
// @author       Cecilian-Elysian
// @background
// @storageName  news-aggregator
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_listValues
// @grant        GM_xmlhttpRequest
// @grant        GM_notification
// @grant        GM_openInTab
// @grant        GM_setClipboard
// @grant        GM_log
// @grant        GM_addValueChangeListener
// @grant        GM_removeValueChangeListener
// @license      MIT
// ==/UserScript==
`

const UI_HEADER = `// ==UserScript==
// @name         新闻聚合面板 NewsAggregator UI
// @namespace    https://github.com/Cecilian-Elysian/news
// @version      0.2.0
// @description  新闻聚合浮动面板（需配合 Core 使用，Hub 兼容）
// @author       Cecilian-Elysian
// @match        *://*/*
// @run-at       document-idle
// @storageName  news-aggregator
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_notification
// @grant        GM_openInTab
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// @grant        GM_setClipboard
// @grant        GM_log
// @grant        GM_addValueChangeListener
// @grant        GM_removeValueChangeListener
// @grant        unsafeWindow
// @license      MIT
// ==/UserScript==
`

const CORE_ONLY = [
  'src/namespace.js',
  'src/constants.js',
  'src/config.js',
  'src/utils/format.js',
  'src/core/dedup.js',
  'src/core/registry.js',
  'src/core/scheduler.js',
  'src/core/storage.js',
  'src/utils/notify.js',
  'src/adapters/base.js',
  'src/adapters/zhihu.js',
  'src/adapters/weibo.js',
  'src/adapters/bilibili.js',
  'src/adapters/baidu.js',
  'src/adapters/toutiao.js',
  'src/adapters/tencent.js',
  'src/adapters/netease.js',
  'src/adapters/hackernews.js',
  'src/adapters/github.js',
  'src/adapters/rss.js',
  'src/adapters/wechat.js',
  'src/adapters/douyin.js',
  'src/adapters/xiaohongshu.js',
  'src/adapters/v2ex.js',
  'src/adapters/kr36.js',
  'src/adapters/thepaper.js',
  'src/entry/core.js',
]

const UI_ONLY = [
  'src/namespace.js',
  'src/constants.js',
  'src/config.js',
  'src/utils/format.js',
  'src/core/storage.js',
  'src/hub-compat.js',
  'src/styles/tokens.css',
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
  'requestAnimationFrame',
  'GM_getValue', 'GM_setValue', 'GM_deleteValue', 'GM_listValues',
  'GM_xmlhttpRequest', 'GM_notification', 'GM_openInTab',
  'GM_setClipboard', 'GM_log', 'GM_addValueChangeListener',
  'GM_removeValueChangeListener', 'GM_registerMenuCommand',
  'GM_addStyle', 'GM_info', 'unsafeWindow', 'confirm', 'alert',
])

const JS_RESERVED = new Set([
  'undefined', 'null', 'true', 'false', 'NaN', 'Infinity',
  'constructor', 'prototype', 'hasOwnProperty', 'toString', 'valueOf',
  'then', 'catch', 'finally',
])

function validateFileList(fileList, label) {
  const errors = []
  for (const f of fileList) {
    if (!existsSync(join(__dirname, f))) errors.push('  ' + f)
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
        !name.startsWith('_') && name === name.toLowerCase() &&
        !/^(on|_)/.test(name) && name.length > 1) {
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
    let content = readFileSync(join(__dirname, f), 'utf-8').trim()
    if (f.endsWith('.css')) {
      content = ';(function() {\n' +
        '  try {\n' +
        '    var __style = document.createElement("style");\n' +
        '    __style.setAttribute("data-cathub-tokens", "' + f.replace(/[^\w.-]/g, '_') + '");\n' +
        '    __style.textContent = ' + JSON.stringify(content) + ';\n' +
        '    (document.head || document.documentElement).appendChild(__style);\n' +
        '  } catch (e) {}\n' +
        '})();'
    }
    parts.push('// === ' + f + ' ===')
    parts.push(content)
    parts.push('')
  }
  return parts.join('\n')
}

function build() {
  try { rmSync(join(__dirname, 'dist', 'news-aggregator.user.js')) } catch (e) {}

  console.log('Validating file lists...')
  validateFileList(CORE_ONLY, 'core')
  validateFileList(UI_ONLY, 'ui')

  console.log('Building core script...')
  const coreBody = concatFiles(CORE_ONLY)
  const coreOut = CORE_HEADER + '\n' + coreBody
  const coreJsBody = concatFiles(CORE_ONLY.filter(f => !f.endsWith('.css')))
  checkSyntax(coreJsBody, 'core')
  checkUndefinedReferences(coreJsBody, 'core')

  console.log('Building UI script...')
  const uiBody = concatFiles(UI_ONLY)
  const uiOut = UI_HEADER + '\n' + uiBody
  const uiJsBody = concatFiles(UI_ONLY.filter(f => !f.endsWith('.css')))
  checkSyntax(uiJsBody, 'ui')
  checkUndefinedReferences(uiJsBody, 'ui')

  const corePath = join(__dirname, 'dist', 'news-core.user.js')
  const uiPath = join(__dirname, 'dist', 'news-ui.user.js')

  writeFileSync(corePath, coreOut, 'utf-8')
  writeFileSync(uiPath, uiOut, 'utf-8')

  const coreSize = (coreOut.length / 1024).toFixed(1)
  const uiSize = (uiOut.length / 1024).toFixed(1)

  console.log(`✅ Built: ${corePath} (${coreSize} KB)`)
  console.log(`✅ Built: ${uiPath} (${uiSize} KB)`)

  if (coreSize > 100) console.warn(`⚠️  Core script is large (${coreSize} KB) — consider removing unused adapters`)
  if (uiSize > 100) console.warn(`⚠️  UI script is large (${uiSize} KB)`)
}

build()