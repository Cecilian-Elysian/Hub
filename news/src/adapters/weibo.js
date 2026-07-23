;(function(ns) {

const BaseAdapter = ns.adapters.BaseAdapter

class WeiboAdapter extends BaseAdapter {
  constructor() {
    super('weibo')
  }

  async fetch() {
    const res = await this._request(
      'https://weibo.com/ajax/side/hotSearch',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Referer: 'https://weibo.com/',
          Accept: 'application/json, text/plain, */*',
          'x-requested-with': 'XMLHttpRequest',
        },
      }
    )
    return JSON.parse(res.responseText)
  }

  normalize(data, source) {
    const articles = []
    const realtime = data.data?.realtime || []
    const hotgov = data.data?.hotgovs || []

    const push = (item, i, label) => {
      const title = item.word || item.word_scheme || item.note || ''
      if (!title) return
      const rawUrl = item.link || item.url || `https://s.weibo.com/weibo?q=${encodeURIComponent(title)}`
      const hotNum = item.raw_hot || item.num || item.label || 0
      articles.push({
        id: `${source}_${label}_${i}_${ns.dedup.simpleHash(title)}`,
        title,
        url: rawUrl.startsWith('http') ? rawUrl : `https://s.weibo.com${rawUrl}`,
        summary: item.flag_desc || item.icon_desc || (hotNum > 0 ? `热度 ${hotNum}` : ''),
        source,
        category: '热搜',
        publishTime: Date.now() - i * 60000,
        keywords: ns.format.extractKeywords(title),
        hot: typeof hotNum === 'number' ? hotNum : 0,
      })
    }

    hotgov.forEach((it, i) => push(it, i, 'gov'))
    realtime.forEach((it, i) => push(it, i, 'rt'))

    return articles
  }
}

ns.adapters.WeiboAdapter = WeiboAdapter
})(NewsAggregator)