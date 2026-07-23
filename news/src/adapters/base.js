;(function(ns) {

ns.adapters = ns.adapters || {}

class BaseAdapter {
  constructor(name) {
    this.name = name
  }

  async fetch(config) {
    throw new Error('fetch() must be implemented')
  }

  normalize(rawArticles, source) {
    throw new Error('normalize() must be implemented')
  }

  _request(url, options = {}) {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        url,
        method: options.method || 'GET',
        headers: options.headers || {},
        responseType: options.responseType || 'text',
        timeout: options.timeout || 15000,
        onload(res) {
          if (res.status >= 200 && res.status < 300) {
            resolve(res)
          } else {
            const err = new Error(`HTTP ${res.status}: ${url}`)
            err.status = res.status
            err.snippet = (res.responseText || '').replace(/\s+/g, ' ').slice(0, 300)
            reject(err)
          }
        },
        onerror(err) {
          const e = new Error(`Network error: ${url}`)
          e.snippet = (err && err.error) || ''
          reject(e)
        },
        ontimeout() {
          const e = new Error(`Timeout (${options.timeout || 15000}ms): ${url}`)
          e.status = 0
          reject(e)
        },
      })
    })
  }

  _parseHTML(html) {
    return this._tryParseHTML(html)
  }

  _tryParseHTML(html) {
    if (typeof DOMParser !== 'undefined') {
      const doc = new DOMParser().parseFromString(html, 'text/html')
      if (doc) return doc
    }
    if (typeof document !== 'undefined' && document.implementation && document.implementation.createHTMLDocument) {
      try {
        const doc = document.implementation.createHTMLDocument('')
        doc.documentElement.innerHTML = html
        return doc
      } catch (e) {
        throw new Error('HTML parse unavailable: ' + (e.message || e))
      }
    }
    throw new Error('HTML parse unavailable in this context')
  }

  _extractText(element, selector) {
    const el = selector ? element.querySelector(selector) : element
    return el ? el.textContent.trim() : ''
  }

  _extractAttr(element, selector, attr) {
    const el = element.querySelector(selector)
    return el ? el.getAttribute(attr) || '' : ''
  }
}

ns.adapters.BaseAdapter = BaseAdapter
// Global aliases for non-namespace-aware adapter files
if (typeof globalThis !== 'undefined') globalThis.BaseAdapter = BaseAdapter
})(NewsAggregator)
