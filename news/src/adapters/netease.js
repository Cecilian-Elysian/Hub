class NeteaseAdapter extends BaseAdapter {
  constructor() {
    super('netease')
  }

  async fetch() {
    const res = await this._request(
      'https://news.163.com/rank/',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      }
    )
    return res.responseText
  }

  normalize(html, source) {
    const doc = this._parseHTML(html)
    const articles = []
    const seen = new Set()

    const items = doc.querySelectorAll('a[href*="163.com"]')
    items.forEach((link, i) => {
      const title = link.textContent.trim()
      if (!title || title.length < 6 || seen.has(title)) return
      seen.add(title)

      const href = link.getAttribute('href') || ''
      const parent = link.closest('td, li, div')
      const summary = parent ? parent.textContent.replace(title, '').trim() : ''

      articles.push({
        id: `${source}_${i}_${simpleHash(title)}`,
        title,
        url: href.startsWith('http') ? href : 'https:' + href,
        summary: summary.slice(0, 200),
        source,
        category: '排行',
        publishTime: Date.now() - i * 120000,
        keywords: extractKeywords(title),
      })
    })

    return articles
  }
}
