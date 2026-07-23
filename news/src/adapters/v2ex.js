class V2exAdapter extends BaseAdapter {
  constructor() {
    super('v2ex')
  }

  async fetch() {
    const res = await this._request(
      'https://www.v2ex.com/api/topics/hot.json',
      { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }
    )
    return JSON.parse(res.responseText)
  }

  normalize(items, source) {
    const articles = []
    const seen = new Set()

    items.forEach((item, i) => {
      const title = item.title || ''
      if (!title || seen.has(title)) return
      seen.add(title)

      articles.push({
        id: `${source}_${item.id || i}_${simpleHash(title)}`,
        title,
        url: `https://www.v2ex.com/t/${item.id}`,
        summary: item.content_rendered ? item.content_rendered.replace(/<[^>]+>/g, '').trim().slice(0, 200) : `by ${item.member?.username || 'unknown'} | ${item.replies || 0} replies`,
        source,
        category: '热门',
        publishTime: (item.created || 0) * 1000,
        keywords: extractKeywords(title),
        hot: item.replies || 0,
      })
    })

    return articles
  }
}
