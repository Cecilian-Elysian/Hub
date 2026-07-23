class Kr36Adapter extends BaseAdapter {
  constructor() {
    super('kr36')
  }

  async fetch() {
    const res = await this._request(
      'https://36kr.com/pp/api/newsflash',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Referer: 'https://36kr.com/',
        },
      }
    )
    return JSON.parse(res.responseText)
  }

  normalize(data, source) {
    const articles = []
    const seen = new Set()
    const items = data.data?.items || []

    items.forEach((item, i) => {
      const title = item.title || item.template_title || ''
      if (!title || seen.has(title)) return
      seen.add(title)

      const url = item.url || item.news_url || `https://36kr.com/p/${item.id}`
      const summary = item.summary || item.description || ''

      articles.push({
        id: `${source}_${item.id || i}_${simpleHash(title)}`,
        title,
        url,
        summary,
        source,
        category: '快讯',
        publishTime: item.published_at ? new Date(item.published_at).getTime() : Date.now() - i * 60000,
        keywords: extractKeywords(title),
      })
    })

    return articles
  }
}
