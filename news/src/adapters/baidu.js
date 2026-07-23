;(function(ns) {

const BaseAdapter = ns.adapters.BaseAdapter

class BaiduAdapter extends BaseAdapter {
  constructor() {
    super('baidu')
  }

  async fetch() {
    const res = await this._request(
      'https://top.baidu.com/board?tab=realtime',
      { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }
    )
    return res.responseText
  }

  normalize(html, source) {
    try {
      return this._parseFromJSON(html, source)
    } catch (e) {
      return this._parseFallback(html, source)
    }
  }

  _parseFromJSON(html, source) {
    const m = html.match(/<!--s-data:(\{[\s\S]+?\})-->/)
    if (!m) throw new Error('No s-data found')

    const data = JSON.parse(m[1])
    const items = []
    for (const card of (data.data?.cards || [])) {
      for (const item of (card.content || [])) {
        items.push(item)
      }
    }

    const articles = []
    const seen = new Set()

    items.forEach((item, i) => {
      const title = item.word || item.query || ''
      if (!title || seen.has(title)) return
      seen.add(title)

      articles.push({
        id: `${source}_${i}_${ns.dedup.simpleHash(title)}`,
        title,
        url: item.url || item.appUrl || `https://www.baidu.com/s?wd=${encodeURIComponent(title)}`,
        summary: (item.desc || '').replace(/<[^>]+>/g, '').trim(),
        source,
        category: '实时热点',
        publishTime: Date.now() - i * 90000,
        keywords: ns.format.extractKeywords(title),
        hot: parseInt(item.hotScore, 10) || 0,
      })
    })

    return articles
  }

  _parseFallback(html, source) {
    const articles = []
    const seen = new Set()

    const titleMatch = html.match(/<div[^>]*class="c-single-text-ellipsis"[^>]*>([^<]+)<\/div>/g)
    const urlMatch = html.match(/<a[^>]*href="([^"]+)"[^>]*class="title-wrapper"[^>]*>/g)
    const descMatch = html.match(/<div[^>]*class="c-summary"[^>]*>([^<]*)<\/div>/g)

    const titles = (titleMatch || []).map(m => m.replace(/<[^>]+>/g, '').trim()).filter(Boolean)
    const urls = (urlMatch || []).map(m => {
      const h = m.match(/href="([^"]+)"/)
      return h ? h[1] : ''
    }).filter(Boolean)

    titles.forEach((title, i) => {
      if (!title || seen.has(title)) return
      seen.add(title)

      let url = urls[i] || ''
      if (url && !url.startsWith('http')) url = 'https://top.baidu.com' + url

      articles.push({
        id: `${source}_${i}_${ns.dedup.simpleHash(title)}`,
        title,
        url,
        summary: descMatch && descMatch[i] ? descMatch[i].replace(/<[^>]+>/g, '').trim() : '',
        source,
        category: '实时热点',
        publishTime: Date.now() - i * 90000,
        keywords: ns.format.extractKeywords(title),
      })
    })

    return articles
  }
}

ns.adapters.BaiduAdapter = BaiduAdapter
})(NewsAggregator)
