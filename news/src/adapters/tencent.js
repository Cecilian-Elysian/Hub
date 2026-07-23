class TencentAdapter extends BaseAdapter {
  constructor() {
    super('tencent')
  }

  async fetch() {
    const res = await this._request(
      'https://news.qq.com/',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      }
    )
    return res.responseText
  }

  normalize(html, source) {
    try {
      return this._parseFromJSON(html, source)
    } catch (e) {
      return this._parseFromHTML(html, source)
    }
  }

  _parseFromJSON(html, source) {
    const m = html.match(/window\.__INITIAL_STATE__\s*=\s*({[\s\S]+?});\s*<\/script>/)
    if (!m) throw new Error('No __INITIAL_STATE__ found')

    const data = JSON.parse(m[1])
    const articles = []
    const seen = new Set()
    const items = []

    const extract = (obj) => {
      if (!obj || typeof obj !== 'object') return
      for (const val of Object.values(obj)) {
        if (val && typeof val === 'object') {
          if (val.title && (val.url || val.link)) items.push(val)
          else extract(val)
        }
      }
    }
    extract(data)

    items.forEach((item, i) => {
      const title = item.title || ''
      if (!title || seen.has(title)) return
      seen.add(title)

      const url = item.url || item.link || ''
      const summary = item.abstract || item.desc || ''

      articles.push({
        id: `${source}_${i}_${simpleHash(title)}`,
        title,
        url: url.startsWith('//') ? 'https:' + url : url,
        summary,
        source,
        category: '热点',
        publishTime: item.pubtime
          ? new Date(item.pubtime).getTime()
          : Date.now() - i * 60000,
        keywords: extractKeywords(title),
      })
    })

    return articles
  }

  _parseFromHTML(html, source) {
    const doc = this._parseHTML(html)
    const articles = []
    const seen = new Set()
    const links = doc.querySelectorAll('a[href*="news.qq.com"][title]')

    links.forEach((link, i) => {
      const title = link.getAttribute('title') || link.textContent.trim()
      if (!title || title.length < 5 || seen.has(title)) return
      seen.add(title)

      let url = link.getAttribute('href') || ''
      if (url && !url.startsWith('http')) url = 'https:' + url

      articles.push({
        id: `${source}_${i}_${simpleHash(title)}`,
        title,
        url,
        summary: '',
        source,
        category: '热点',
        publishTime: Date.now() - i * 120000,
        keywords: extractKeywords(title),
      })
    })

    return articles
  }
}
