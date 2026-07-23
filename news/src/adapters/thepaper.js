class ThepaperAdapter extends BaseAdapter {
  constructor() {
    super('thepaper')
  }

  async fetch() {
    const res = await this._request(
      'https://www.thepaper.cn/api/v1/hot/list',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Referer: 'https://www.thepaper.cn/',
        },
      }
    )
    return res.responseText
  }

  normalize(html, source) {
    const articles = []
    const seen = new Set()

    try {
      const data = JSON.parse(html)
      const list = data.data?.list || data.list || []

      list.forEach((item, i) => {
        const title = item.title || item.name || ''
        if (!title || seen.has(title)) return
        seen.add(title)

        const url = item.url || item.link || (item.id ? `https://www.thepaper.cn/newsDetail_forward_${item.id}` : '')
        const summary = item.summary || item.abstract || item.desc || ''

        articles.push({
          id: `${source}_${item.id || i}_${simpleHash(title)}`,
          title,
          url,
          summary,
          source,
          category: '热点',
          publishTime: item.pub_time || item.publish_time
            ? new Date(item.pub_time || item.publish_time).getTime()
            : Date.now() - i * 90000,
          keywords: extractKeywords(title),
        })
      })
    } catch (e) {
      return this._parseFallback(html, source)
    }

    return articles
  }

  _parseFallback(html, source) {
    const articles = []
    const seen = new Set()
    const doc = this._parseHTML(html)

    const links = doc.querySelectorAll('a')
    links.forEach((link, i) => {
      const title = link.textContent.trim()
      if (!title || title.length < 6 || seen.has(title)) return
      seen.add(title)

      const href = link.getAttribute('href') || ''
      const parent = link.closest('div, li')
      const summary = parent ? parent.textContent.replace(title, '').trim().slice(0, 200) : ''

      articles.push({
        id: `${source}_${i}_${simpleHash(title)}`,
        title,
        url: href.startsWith('http') ? href : `https://www.thepaper.cn${href}`,
        summary,
        source,
        category: '热点',
        publishTime: Date.now() - i * 120000,
        keywords: extractKeywords(title),
      })
    })

    return articles
  }
}
