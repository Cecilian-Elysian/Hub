;(function(ns) {

function formatTime(ts, opts) {
  if (!ts || ts <= 0) return '—'
  opts = opts || {}
  const now = Date.now()
  const diff = now - ts
  if (opts.relative !== false) {
    if (diff < 0) {
      const future = -diff
      if (future < 60000) return '即将'
      if (future < 3600000) return Math.floor(future / 60000) + ' 分钟后'
      if (future < 86400000) return Math.floor(future / 3600000) + ' 小时后'
      return Math.floor(future / 86400000) + ' 天后'
    }
    if (diff < 60000) return Math.floor(diff / 1000) + ' 秒前'
    if (diff < 3600000) return Math.floor(diff / 60000) + ' 分钟前'
    if (diff < 86400000) return Math.floor(diff / 3600000) + ' 小时前'
    if (diff < 7 * 86400000) return Math.floor(diff / 86400000) + ' 天前'
  }
  const d = new Date(ts)
  const y = d.getFullYear()
  const M = String(d.getMonth() + 1).padStart(2, '0')
  const D = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  const sameDay = new Date(now).toDateString() === d.toDateString()
  if (sameDay) return `今天 ${h}:${m}`
  const sameYear = new Date(now).getFullYear() === y
  if (sameYear) return `${M}-${D} ${h}:${m}`
  return `${y}-${M}-${D} ${h}:${m}`
}

function formatCount(n, label) {
  if (n == null || isNaN(n)) return '—'
  const abs = Math.abs(n)
  let formatted
  if (abs >= 10000) formatted = (n / 10000).toFixed(1) + 'w'
  else if (abs >= 1000) formatted = (n / 1000).toFixed(1) + 'k'
  else formatted = String(n)
  return label ? `${formatted} ${label}` : formatted
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

function truncate(str, max) {
  if (!str) return ''
  max = max || 60
  if (str.length <= max) return str
  return str.slice(0, max - 1) + '…'
}

function bytes(n) {
  if (n == null) return '0 B'
  if (n < 1024) return n + ' B'
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB'
  return (n / 1024 / 1024).toFixed(2) + ' MB'
}

ns.format = { formatTime, formatCount, escapeHtml, truncate, bytes }

})(CatHub)