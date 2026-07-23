class XiaohongshuAdapter extends BaseAdapter {
  constructor() {
    super('xiaohongshu')
  }

  async fetch() {
    const res = await this._request(
      'https://www.xiaohongshu.com/explore',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html',
        },
      }
    )
    return res.responseText
  }

  normalize(html, source) {
    const articles = []
    const seen = new Set()

    try {
      return this._parseFromJSON(html, source)
    } catch (e) {
      return this._parseFromHTML(html, source)
    }
  }

  _parseFromJSON(html, source) {
    const m = html.match(/<script>window\.__INITIAL_STATE__\s*=\s*({[\s\S]+?});?\s*<\/script>/)
    if (!m) throw new Error('No __INITIAL_STATE__ found')

    const data = JSON.parse(m[1])
    const articles = []
    const seen = new Set()

    const extract = (obj) => {
      if (!obj || typeof obj !== 'object') return
      for (const val of Object.values(obj)) {
        if (val && typeof val === 'object') {
          if (val.title && (val.note_id || val.id)) {
            const title = val.title || val.display_title || ''
            if (title && !seen.has(title)) {
              seen.add(title)
              articles.push({
                id: `${source}_${val.note_id || val.id}_${simpleHash(title)}`,
                title,
                url: `https://www.xiaohongshu.com/explore/${val.note_id}`,
                summary: val.desc || val.summary || val.abstract || '',
                source,
                category: '发现',
                publishTime: val.time ? val.time * 1000 : Date.now() - articles.length * 60000,
                keywords: extractKeywords(title),
                hot: val.likes_count || val.liked_count || 0,
              })
            }
          }
          extract(val)
        }
      }
    }
    extract(data)

    return articles
  }

  _parseFromHTML(html, source) {
    const articles = []
    const seen = new Set()
    const doc = this._parseHTML(html)

    const items = doc.querySelectorAll('section.note-item, .feeds-page .note-item, [class*="note-item"]')
    items.forEach((item, i) => {
      const link = item.querySelector('a[href*="explore"]')
      if (!link) return

      const title = link.getAttribute('title') || link.textContent.trim()
      if (!title || title.length < 2 || seen.has(title)) return
      seen.add(title)

      const href = link.getAttribute('href') || ''
      const descEl = item.querySelector('.note-desc, .desc, [class*="desc"]')
      const summary = descEl ? descEl.textContent.trim() : ''

      articles.push({
        id: `${source}_${i}_${simpleHash(title)}`,
        title,
        url: href.startsWith('http') ? href : `https://www.xiaohongshu.com${href}`,
        summary,
        source,
        category: '发现',
        publishTime: Date.now() - i * 120000,
        keywords: extractKeywords(title),
      })
    })

    return articles
  }
}
