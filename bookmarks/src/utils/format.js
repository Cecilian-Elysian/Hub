;(function(ns) {

function pad(n) { return n < 10 ? '0' + n : '' + n }

function formatTime(ts) {
  if (!ts) return ''
  const date = new Date(ts)
  const now = Date.now()
  const diff = now - ts
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`
  return `${date.getMonth() + 1}/${date.getDate()}`
}

function formatDate(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function escapeHtml(str) {
  if (str == null) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function truncate(str, len = 100) {
  if (!str) return ''
  return str.length > len ? str.slice(0, len) + '...' : str
}

function _group(bookmarks, groupBy) {
  const groups = new Map()
  for (const b of bookmarks) {
    let key
    if (groupBy === 'folder') {
      key = b.folderPath || b.folder || '未分类'
    } else if (groupBy === 'time') {
      const d = new Date(b.addDate || b.importTime || 0)
      key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
    } else {
      key = '全部书签'
    }
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(b)
  }
  return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b, 'zh'))
}

function generateMarkdown(bookmarks, options = {}) {
  const cfg = options || {}
  const groupBy = cfg.groupBy || 'folder'
  const includeTs = cfg.includeTimestamp !== false
  const title = cfg.title || '网址收藏'
  const lines = []
  lines.push(`# ${title}`)
  lines.push('')
  lines.push(`共收录 **${bookmarks.length}** 条网址`)
  lines.push('')
  if (includeTs) {
    lines.push(`> 导出时间: ${formatDate(Date.now())}`)
    lines.push('')
  }
  lines.push('---')
  lines.push('')
  const groups = _group(bookmarks, groupBy)
  for (const [name, items] of groups) {
    lines.push(`## ${name} (${items.length})`)
    lines.push('')
    items.forEach((b, i) => {
      const t = b.addDate ? ` _${formatDate(b.addDate)}_` : ''
      lines.push(`${i + 1}. [${b.title || b.url}](${b.url})${t}`)
    })
    lines.push('')
  }
  return lines.join('\n')
}

function generateJSON(bookmarks) {
  return JSON.stringify({
    exportedAt: new Date().toISOString(),
    count: bookmarks.length,
    bookmarks: bookmarks.map(b => ({
      title: b.title,
      url: b.url,
      folder: b.folder,
      folderPath: b.folderPath,
      addDate: b.addDate,
      icon: b.icon,
      tags: b.tags,
      description: b.description,
    })),
  }, null, 2)
}

function generateNetscapeHtml(bookmarks, options = {}) {
  const title = options.title || 'Bookmarks'
  const lines = []
  lines.push('<!DOCTYPE NETSCAPE-Bookmark-file-1>')
  lines.push('<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">')
  lines.push(`<TITLE>${escapeHtml(title)}</TITLE>`)
  lines.push(`<H1>${escapeHtml(title)}</H1>`)
  lines.push('<DL><p>')
  const tree = _buildTree(bookmarks)
  for (const node of tree) _writeFolder(lines, node, 1)
  lines.push('</DL><p>')
  return lines.join('\n')
}

function _buildTree(bookmarks) {
  const root = { name: '', children: new Map(), bookmarks: [] }
  for (const b of bookmarks) {
    const parts = (b.folderPath || b.folder || '').split('/').filter(Boolean)
    let cur = root
    for (const p of parts) {
      if (!cur.children.has(p)) cur.children.set(p, { name: p, children: new Map(), bookmarks: [] })
      cur = cur.children.get(p)
    }
    cur.bookmarks.push(b)
  }
  return Array.from(root.children.values())
}

function _writeFolder(lines, node, depth) {
  lines.push(`${'  '.repeat(depth)}<DT><H3>${escapeHtml(node.name)}</H3>`)
  lines.push(`${'  '.repeat(depth)}<DL><p>`)
  for (const b of node.bookmarks) {
    const addDate = b.addDate ? Math.floor(b.addDate / 1000) : ''
    const tags = b.tags && b.tags.length ? ` TAGS="${escapeHtml(b.tags.join(','))}"` : ''
    lines.push(`${'  '.repeat(depth + 1)}<DT><A HREF="${escapeHtml(b.url)}" ADD_DATE="${addDate}"${tags}>${escapeHtml(b.title || b.url)}</A>`)
  }
  for (const child of Array.from(node.children.values())) {
    _writeFolder(lines, child, depth + 1)
  }
  lines.push(`${'  '.repeat(depth)}</DL><p>`)
}

ns.format = {
  formatTime, formatDate, pad, escapeHtml, truncate,
  generateMarkdown, generateJSON, generateNetscapeHtml,
}
})(BookmarkLogger)