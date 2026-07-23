class WechatAdapter extends BaseAdapter {
  constructor() {
    super('wechat')
  }

  async fetch() {
    const res = await this._request(
      'https://tophub.today/c/news',
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

    const itemRe = /<a\s+href="(https?:\/\/mp\.weixin\.qq\.com[^"]+)"[^>]*itemid="(\d+)"[^>]*>[\s\S]*?<span class="t">([^<]+)<\/span>(?:[\s\S]*?<span class="e">([^<]+)<\/span>)?/g
    let m
    while ((m = itemRe.exec(html))) {
      const url = m[1]
      const itemid = m[2]
      const title = m[3].trim()
      const heat = (m[4] || '').trim()

      if (!title || title.length < 4 || seen.has(title)) continue
      seen.add(title)

      const rawNum = parseFloat(heat.replace(/[^\d.]/g, '')) || 0
      const heatNum = heat.includes('万') ? rawNum * 10000 : rawNum

      articles.push({
        id: `${source}_${itemid}`,
        title,
        url,
        summary: heat ? `热度 ${heat}` : '',
        source,
        category: '公众号热文',
        publishTime: Date.now() - (seen.size - 1) * 180000,
        keywords: extractKeywords(title),
        hot: heatNum,
      })
      if (articles.length >= 50) break
    }

    return articles
  }
}