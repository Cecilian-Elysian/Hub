;(function(ns) {

const SOURCE_LABELS = ns.constants.SOURCE_LABELS

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

function pad(n) {
  return n < 10 ? '0' + n : '' + n
}

function truncate(str, len = 100) {
  if (!str) return ''
  return str.length > len ? str.slice(0, len) + '...' : str
}

function escapeHtml(str) {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const _ZH_STOP_WORDS = new Set([
  '的', '了', '是', '在', '我', '有', '和', '就', '不', '人', '都',
  '一', '个', '上', '也', '很', '到', '说', '要', '去', '你', '会',
  '着', '没', '看', '好', '自', '己', '这', '他', '她', '它', '们',
  '为', '与', '之', '其', '中', '大', '小', '多', '少', '能', '做',
  '对', '那', '下', '而', '过', '被', '使', '用', '以', '于', '时',
  '所', '如', '后', '前', '将', '等',
])

function extractKeywords(title) {
  if (!title) return []
  const keywords = []
  const seen = new Set()
  const zh = title.match(/[\u4e00-\u9fff]+/g) || []
  for (const chunk of zh) {
    for (let i = 0; i < chunk.length - 1; i++) {
      for (let len = 2; len <= 3 && i + len <= chunk.length; len++) {
        const kw = chunk.slice(i, i + len)
        const startStop = _ZH_STOP_WORDS.has(kw[0])
        const endStop = _ZH_STOP_WORDS.has(kw[kw.length - 1])
        if (startStop || endStop || seen.has(kw)) continue
        seen.add(kw)
        keywords.push(kw)
      }
    }
  }
  const en = title.match(/[a-zA-Z]{3,}/g) || []
  for (const w of en) {
    const lw = w.toLowerCase()
    if (!seen.has(lw)) { seen.add(lw); keywords.push(lw) }
  }
  return keywords
}

function generateDigestMarkdown(articles, startDate, endDate) {
  const lines = []
  lines.push(`# 新闻周报 (${formatDate(startDate)} - ${formatDate(endDate)})`)
  lines.push('')
  lines.push(`共收录 **${articles.length}** 条新闻`)
  lines.push('')
  lines.push('---')
  lines.push('')

  const bySource = {}
  for (const a of articles) {
    if (!bySource[a.source]) bySource[a.source] = []
    bySource[a.source].push(a)
  }

  for (const [source, items] of Object.entries(bySource)) {
    const label = SOURCE_LABELS[source] || source
    lines.push(`## ${label} (${items.length} 条)`)
    lines.push('')
    items.forEach((a, i) => {
      lines.push(`${i + 1}. [${a.title}](${a.url || '#'})`)
      if (a.summary) lines.push(`   > ${truncate(a.summary, 120)}`)
      if (a.keywords && a.keywords.length) lines.push(`   \`${a.keywords.slice(0, 3).join('` `')}\``)
      lines.push('')
    })
    lines.push('')
  }

  lines.push('---')
  lines.push(`> 由 News Aggregator 自动生成于 ${formatDate(Date.now())}`)
  return lines.join('\n')
}

ns.format = { formatTime, formatDate, pad, truncate, escapeHtml, generateDigestMarkdown, extractKeywords }
if (typeof globalThis !== 'undefined') globalThis.extractKeywords = extractKeywords
})(NewsAggregator)
