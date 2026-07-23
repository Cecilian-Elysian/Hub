;(function(ns) {

function decodeHtmlEntities(str) {
  if (!str) return ''
  const named = {
    '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"',
    '&apos;': "'", '&#39;': "'", '&nbsp;': ' ',
  }
  let out = str.replace(/&(amp|lt|gt|quot|apos|#39|nbsp);/g, m => named[m] || m)
  out = out.replace(/&#(\d+);/g, (_, code) => {
    try { return String.fromCodePoint(parseInt(code, 10)) } catch (e) { return '' }
  })
  out = out.replace(/&#x([0-9a-fA-F]+);/g, (_, code) => {
    try { return String.fromCodePoint(parseInt(code, 16)) } catch (e) { return '' }
  })
  return out
}

function _stripTags(s) {
  return s.replace(/<[^>]*>/g, '')
}

function _extractAttr(tag, name) {
  const re = new RegExp(name + "\\s*=\\s*\"([^\"]*)\"", 'i')
  const m = tag.match(re)
  if (m) return decodeHtmlEntities(m[1])
  const re2 = new RegExp(name + "\\s*=\\s*'([^']*)'", 'i')
  const m2 = tag.match(re2)
  if (m2) return decodeHtmlEntities(m2[1])
  return ''
}

function _decodeDate(s) {
  if (!s) return 0
  const n = parseInt(s, 10)
  if (isNaN(n) || n <= 0) return 0
  if (n < 1e11) return n * 1000
  return n
}

function _tokenize(html) {
  const tokens = []
  const re = /<\/?(DT|DL|H3|P|A|DD|H1|TITLE|HEAD|META|DOCTYPE|BODY|HTML)\b[^>]*>|<!--[\s\S]*?-->/gi
  let lastIndex = 0
  let m
  while ((m = re.exec(html)) !== null) {
    if (m.index > lastIndex) {
      const between = html.slice(lastIndex, m.index)
      const text = decodeHtmlEntities(_stripTags(between))
      if (text.trim()) tokens.push({ type: 'text', value: text })
    }
    const raw = m[0]
    const tagMatch = raw.match(/^<\/?([A-Z][A-Z0-9]*)/i)
    if (!tagMatch) { lastIndex = re.lastIndex; continue }
    const name = tagMatch[1].toUpperCase()
    const isClose = raw.startsWith('</')

    if (name === 'H3' && !isClose) {
      tokens.push({ type: 'h3_open' })
    } else if (name === 'H3' && isClose) {
      tokens.push({ type: 'h3_close' })
    } else if (name === 'A' && !isClose) {
      const href = _extractAttr(raw, 'HREF')
      const addDate = _decodeDate(_extractAttr(raw, 'ADD_DATE'))
      const icon = _extractAttr(raw, 'ICON')
      const privateFlag = /["'\s]PRIVATE["'\s=]/i.test(raw)
      const tags = _extractAttr(raw, 'TAGS')
      tokens.push({ type: 'a_open', href, addDate, icon, privateFlag, tagsAttr: tags })
    } else if (name === 'A' && isClose) {
      tokens.push({ type: 'a_close' })
    } else if (name === 'DL' && !isClose) {
      tokens.push({ type: 'dl_open' })
    } else if (name === 'DL' && isClose) {
      tokens.push({ type: 'dl_close' })
    } else if (name === 'DT' && !isClose) {
      tokens.push({ type: 'dt' })
    }
    lastIndex = re.lastIndex
  }
  return tokens
}

function _parseFromTokens(tokens) {
  const root = { name: '', children: [], bookmarks: [] }
  const stack = [root]
  let currentFolder = root
  let pendingFolder = null
  let pendingBookmark = null
  let textBuf = ''

  function flushText() {
    if (!textBuf.trim()) { textBuf = ''; return }
    if (pendingBookmark) {
      pendingBookmark.title += textBuf
    } else if (pendingFolder) {
      pendingFolder.label = (pendingFolder.label || '') + textBuf
    }
    textBuf = ''
  }

  for (const t of tokens) {
    if (t.type === 'text') {
      textBuf += t.value
    } else if (t.type === 'h3_open') {
      flushText()
      const folder = { name: '', label: '', children: [], bookmarks: [] }
      currentFolder.children.push(folder)
      pendingFolder = folder
      pendingBookmark = null
    } else if (t.type === 'h3_close') {
      flushText()
      if (pendingFolder) {
        pendingFolder.name = (pendingFolder.label || '').trim() || pendingFolder.name
        delete pendingFolder.label
      }
    } else if (t.type === 'dl_open') {
      flushText()
      if (pendingFolder) {
        stack.push(pendingFolder)
        currentFolder = pendingFolder
        pendingFolder = null
      }
    } else if (t.type === 'dl_close') {
      flushText()
      if (stack.length > 1) {
        stack.pop()
        currentFolder = stack[stack.length - 1]
      }
      pendingBookmark = null
    } else if (t.type === 'dt') {
      flushText()
      pendingBookmark = null
    } else if (t.type === 'a_open') {
      flushText()
      if (!t.href) { pendingBookmark = null; continue }
      const bm = {
        title: '',
        url: t.href,
        addDate: t.addDate || 0,
        icon: t.icon || '',
        tags: t.tagsAttr ? t.tagsAttr.split(',').map(s => s.trim()).filter(Boolean) : [],
        private: !!t.privateFlag,
      }
      pendingBookmark = bm
      currentFolder.bookmarks.push(bm)
    } else if (t.type === 'a_close') {
      flushText()
      if (pendingBookmark) {
        pendingBookmark.title = pendingBookmark.title.trim()
      }
      pendingBookmark = null
    }
  }
  return root
}

function _flatten(root) {
  const out = []
  function walk(folder, ancestors) {
    const myPath = folder.name ? [...ancestors, folder.name] : ancestors
    for (const bm of folder.bookmarks) {
      if (!bm.url) continue
      const path = myPath.join('/')
      out.push({
        title: bm.title || bm.url,
        url: bm.url,
        folder: myPath.length ? myPath[myPath.length - 1] : '',
        folderPath: path,
        addDate: bm.addDate || 0,
        icon: bm.icon || '',
        tags: bm.tags || [],
        private: !!bm.private,
      })
    }
    for (const child of folder.children) walk(child, myPath)
  }
  walk(root, [])
  return out
}

function parseBookmarksHtml(html) {
  if (!html || typeof html !== 'string') return []
  const tokens = _tokenize(html)
  const root = _parseFromTokens(tokens)
  return _flatten(root)
}

ns.parser = { parseBookmarksHtml, decodeHtmlEntities }
})(BookmarkLogger)