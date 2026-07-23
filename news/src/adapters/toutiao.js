class ToutiaoAdapter extends BaseAdapter {
  constructor() {
    super('toutiao')
  }

  async fetch() {
    const res = await this._request(
      'https://www.toutiao.com/hot-event/hot-board/',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Referer: 'https://www.toutiao.com/',
        },
      }
    )
    return JSON.parse(res.responseText)
  }

  normalize(data, source) {
    const articles = []
    const seen = new Set()
    const list = data.data || []

    list.forEach((item, i) => {
      const title = item.Title || item.title || item.Word || item.word || ''
      if (!title || seen.has(title)) return
      seen.add(title)

      const url = item.Url || item.url || item.ShareUrl || ''
      const hot = item.HotValue || item.hot_value || item.hot || 0
      const summary = item.Description || item.desc || item.abstract || ''

      articles.push({
        id: `${source}_${i}_${simpleHash(title)}`,
        title,
        url,
        summary,
        source,
        category: '热榜',
        publishTime: item.EventTime
          ? new Date(item.EventTime).getTime()
          : Date.now() - i * 60000,
        keywords: extractKeywords(title),
        hot,
      })
    })

    return articles
  }
}
