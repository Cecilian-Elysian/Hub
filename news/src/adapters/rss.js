;(function(ns) {

const BaseAdapter = ns.adapters.BaseAdapter

class RssAdapter extends BaseAdapter {
  constructor() {
    super('rss')
  }

  async fetch(config) {
    const urls = config.urls || []
    const results = []
    for (const url of urls) {
      try {
        const res = await this._request(url, { timeout: 10000 })
        results.push({ url, data: res.responseText })
      } catch (e) {
        GM_log(`[RSS] Failed to fetch ${url}: ${e.message}`, 'warn')
      }
    }
    return results
  }

  normalize(results, source) {
    const articles = []
    for (const { url, data } of results) {
      const feed = this._parseFeed(data, url)
      articles.push(...feed)
    }
    return articles
  }

  _parseFeed(data, feedUrl) {
    const articles = []
    const isAtom = data.includes('<feed') || data.includes('xmlns="http://www.w3.org/2005/Atom"')

    if (isAtom) {
      const items = data.match(/<entry[\s\S]*?<\/entry>/g) || []
      items.forEach((item, i) => {
        const title = this._extractTag(item, 'title')
        if (!title) return
        const id = this._extractTag(item, 'id') || `${feedUrl}_${i}`
        const linkMatch = item.match(/<link[^>]*href="([^"]+)"/)
        let linkUrl = linkMatch ? linkMatch[1] : feedUrl
        if (linkUrl && !linkUrl.startsWith('http')) {
          try { linkUrl = new URL(linkUrl, feedUrl).href } catch { linkUrl = '' }
        }
        articles.push(this._makeArticle({
          id: ns.dedup.simpleHash(id),
          title,
          url: linkUrl,
          summary: this._extractTag(item, 'summary') || this._extractTag(item, 'content'),
          pubDate: this._extractTag(item, 'published') || this._extractTag(item, 'updated'),
          source: 'rss',
          category: '订阅',
          keywords: ns.format.extractKeywords(title),
        }))
      })
    } else {
      const items = data.match(/<item[\s\S]*?<\/item>/g) || []
      items.forEach((item, i) => {
        const title = this._extractTag(item, 'title')
        if (!title) return
        let linkUrl = this._extractTag(item, 'link')
        if (linkUrl && !linkUrl.startsWith('http')) {
          try { linkUrl = new URL(linkUrl, feedUrl).href } catch { linkUrl = '' }
        }
        articles.push(this._makeArticle({
          id: ns.dedup.simpleHash(this._extractTag(item, 'guid') || `${feedUrl}_${i}`),
          title,
          url: linkUrl,
          summary: this._extractTag(item, 'description'),
          pubDate: this._extractTag(item, 'pubDate'),
          source: 'rss',
          category: '订阅',
          keywords: ns.format.extractKeywords(title),
        }))
      })
    }
    return articles
  }

  _extractTag(xml, tag) {
    const match = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i'))
    if (!match) return ''
    return match[1]
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
      .replace(/<[^>]+>/g, '')
      .trim()
  }

  _makeArticle({ id, title, url, summary, pubDate, source, category, keywords }) {
    return {
      id: `${source}_${id}`,
      title,
      url: url || '',
      summary: (summary || '').slice(0, 500),
      source,
      category,
      publishTime: pubDate ? new Date(pubDate).getTime() : Date.now(),
      keywords,
    }
  }
}

ns.adapters.RssAdapter = RssAdapter
})(NewsAggregator)
