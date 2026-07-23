class HackernewsAdapter extends BaseAdapter {
  constructor() {
    super('hackernews')
  }

  async fetch() {
    const res = await this._request(
      'https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=30',
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    )
    const data = JSON.parse(res.responseText)
    return data.hits || []
  }

  normalize(items, source) {
    const articles = []
    const seen = new Set()

    items.forEach((item, i) => {
      const title = item.title || item.story_title || ''
      if (!title || seen.has(title)) return
      seen.add(title)

      const url = item.url || (item.objectID ? `https://news.ycombinator.com/item?id=${item.objectID}` : '')
      const score = item.points || 0
      const by = item.author || ''
      const comments = item.num_comments || item.children || 0
      const created = item.created_at_i || 0

      articles.push({
        id: `${source}_${item.objectID || i}`,
        title,
        url,
        summary: `by ${by} | ${score} points | ${comments} comments`,
        source,
        category: 'Top Stories',
        publishTime: created * 1000,
        keywords: extractKeywords(title),
        hot: score,
      })
    })

    return articles
  }
}