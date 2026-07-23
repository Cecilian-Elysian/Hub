;(function(ns) {

const BaseAdapter = ns.adapters.BaseAdapter

class ZhihuAdapter extends BaseAdapter {
  constructor() {
    super('zhihu')
  }

  async fetch() {
    const res = await this._request(
      'https://www.zhihu.com/api/v3/feed/topstory/hot-lists?limit=50',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://www.zhihu.com/hot',
          'x-requested-with': 'XMLHttpRequest',
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
      const target = item.target || {}
      const title = target.title || ''
      if (!title || seen.has(title)) return
      seen.add(title)

      const id = target.id || `${i}`
      const url = target.url && target.url.startsWith('http')
        ? target.url
        : `https://www.zhihu.com/question/${id}`

      articles.push({
        id: `${source}_${id}_${ns.dedup.simpleHash(title)}`,
        title,
        url,
        summary: target.excerpt || item.detail_text || '',
        source,
        category: '热榜',
        publishTime: target.created ? target.created * 1000 : Date.now(),
        keywords: ns.format.extractKeywords(title),
        hot: item.detail_text || '',
      })
    })

    return articles
  }
}

ns.adapters.ZhihuAdapter = ZhihuAdapter
})(NewsAggregator)
