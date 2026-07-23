;(function(ns) {

const SOURCE_LABELS = ns.constants.SOURCE_LABELS

let _running = false

let _progressTimer = null

function _reportProgress(state) {
  if (_progressTimer) clearTimeout(_progressTimer)
  _progressTimer = setTimeout(() => {
    _progressTimer = null
    try { GM_setValue('refresh_progress', state) } catch (e) {
      GM_log(`[scheduler] Failed to report progress: ${e.message}`, 'warn')
    }
  }, state && state.running ? 200 : 0)
}

function _recordFetchLog(results, finishedAt) {
  try {
    const prev = GM_getValue('fetch_log', {})
    prev.lastFetch = finishedAt
    prev.lastResult = {
      success: results.success,
      failed: results.failed,
      failures: results.failures || [],
      new: results.new,
      total: results.total,
      skipped: !!results.skipped,
    }
    GM_setValue('fetch_log', prev)
  } catch (e) {
    GM_log(`[scheduler] Failed to record fetch log: ${e.message}`, 'warn')
  }
}

async function runAllAdapters() {
  if (_running) return { skipped: true }
  _running = true
  const results = { success: [], failed: [], failures: [], total: 0, new: 0 }

  try {
    const config = ns.config.getConfig()
    const enabledSources = Object.entries(config.sources)
      .filter(([, v]) => v.enabled)
      .sort(([, a], [, b]) => a.order - b.order)

    const total = enabledSources.length
    const sourceStates = {}
    for (const [name] of enabledSources) {
      sourceStates[name] = 'pending'
    }
    _reportProgress({ running: true, total, sourceStates, newCount: 0 })

    // Run all adapter fetches in batches of 4 for concurrency control
    const BATCH_SIZE = 4
    const fetchResults = []
    for (let batchStart = 0; batchStart < enabledSources.length; batchStart += BATCH_SIZE) {
      const batch = enabledSources.slice(batchStart, batchStart + BATCH_SIZE)
      const batchResults = await Promise.all(batch.map(async ([name, sourceCfg]) => {
        sourceStates[name] = 'fetching'
        _reportProgress({ running: true, total, sourceStates: { ...sourceStates }, newCount: 0 })

        try {
          const adapter = ns.registry.getAdapter(name)
          if (!adapter) {
            sourceStates[name] = 'failed'
            const err = new Error('Adapter not registered')
            err.status = 0
            return { name, success: false, articles: [], error: err.message, failure: { name, error: err.message, status: 0, snippet: '' } }
          }
          const rawArticles = await adapter.fetch(sourceCfg)
          const normalized = adapter.normalize(rawArticles, name)
          sourceStates[name] = 'success'
          _reportProgress({ running: true, total, sourceStates: { ...sourceStates }, newCount: 0 })
          return { name, success: true, articles: normalized }
        } catch (e) {
          GM_log(`[NewsAggregator] Adapter ${name} failed: ${e.message}`, 'error')
          sourceStates[name] = 'failed'
          _reportProgress({ running: true, total, sourceStates: { ...sourceStates }, newCount: 0 })
          return {
            name,
            success: false,
            articles: [],
            error: e.message,
            failure: {
              name,
              error: e.message,
              status: e.status || 0,
              snippet: e.snippet || '',
            },
          }
        }
      }))
      fetchResults.push(...batchResults)
    }

    // Process results sequentially for safe dedup
    for (const result of fetchResults) {
      if (result.success) {
        const existing = GM_getValue('articles', [])
        const newArticles = result.articles.filter(a => !ns.dedup.isDuplicate(a, existing))
        if (newArticles.length > 0) {
          ns.storage.addArticles(newArticles)
        }
        results.success.push(result.name)
        results.new += newArticles.length
        results.total += result.articles.length
      } else {
        results.failed.push(result.name)
        if (result.failure) results.failures.push(result.failure)
      }
    }

    _recordFetchLog(results, Date.now())
  } finally {
    _running = false
    _reportProgress({ running: false })
  }

  return results
}

ns.scheduler = { runAllAdapters, SOURCE_LABELS }
})(NewsAggregator)