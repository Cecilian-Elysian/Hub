class DouyinAdapter extends BaseAdapter {
  constructor() {
    super('douyin')
  }

  async fetch() {
    const res = await this._request(
      'https://www.douyin.com/aweme/v1/web/hot/search/list/',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Referer: 'https://www.douyin.com/',
          Accept: 'application/json',
        },
      }
    )
    return JSON.parse(res.responseText)
  }

  normalize(data, source) {
    const articles = []
    const seen = new Set()
    const list = data.data?.word_list || data?.word_list || []

    list.forEach((item, i) => {
      const title = item.word || item.hot_word || item.title || ''
      if (!title || seen.has(title)) return
      seen.add(title)

      const hot = item.hot_value || item.hot_score || item.hot || 0
      const sid = item.sentence_id || ''
      const url = sid
        ? `https://www.douyin.com/hot/${sid}/`
        : (item.link || item.url || `https://www.douyin.com/search/${encodeURIComponent(title)}`)

      articles.push({
        id: `${source}_${item.group_id || sid || i}`,
        title,
        url,
        summary: hot > 0 ? `热度 ${hot}` : (item.label ? `标签 ${item.label}` : ''),
        source,
        category: '热榜',
        publishTime: item.event_time ? item.event_time * 1000 : Date.now() - i * 120000,
        keywords: extractKeywords(title),
        hot,
      })
    })

    return articles
  }
}