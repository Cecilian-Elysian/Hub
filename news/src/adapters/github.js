class GithubAdapter extends BaseAdapter {
  constructor() {
    super('github')
  }

  async fetch() {
    const res = await this._request(
      'https://github.com/trending',
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
    const doc = this._parseHTML(html)
    const articles = []
    const seen = new Set()

    const repos = doc.querySelectorAll('article.Box-row')
    repos.forEach((repo, i) => {
      const h2 = repo.querySelector('h2')
      if (!h2) return

      const title = h2.textContent.replace(/\s+/g, ' ').trim()
      if (!title || seen.has(title)) return
      seen.add(title)

      const relPath = h2.querySelector('a')?.getAttribute('href') || ''
      const url = relPath ? `https://github.com${relPath}` : ''

      const descEl = repo.querySelector('p')
      const summary = descEl ? descEl.textContent.trim() : ''

      const starsEl = repo.querySelector('.octicon-star')
      const stars = starsEl
        ? parseInt((starsEl.closest('a')?.textContent || '0').replace(/[^0-9]/g, ''), 10) || 0
        : 0

      const langEl = repo.querySelector('[itemprop="programmingLanguage"]')
      const lang = langEl ? langEl.textContent.trim() : ''

      articles.push({
        id: `${source}_${i}_${simpleHash(title)}`,
        title,
        url,
        summary: lang ? `[${lang}] ${summary}` : summary,
        source,
        category: 'Trending',
        publishTime: Date.now() - i * 3600000,
        keywords: extractKeywords(title),
        hot: stars,
      })
    })

    return articles
  }
}
