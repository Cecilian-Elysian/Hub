;(function(ns) {

const REGISTRY = [
  {
    id: 'bookmarks',
    namespace: 'BookmarkLogger',
    storageName: 'bookmarks-aggregator',
    name: '网址收藏',
    description: '导入/导出浏览器书签',
    icon: 'bookmark',
    color: '#3b82f6',
    repo: 'bookmarks',
    installUrl: 'https://github.com/Cecilian-Elysian/bookmarks/raw/main/dist/bookmarks.user.js',
    version: '>=0.2.0',
    enabled: true,
  },
  {
    id: 'news',
    namespace: 'NewsAggregator',
    storageName: 'news-aggregator',
    name: '新闻聚合',
    description: '多源新闻抓取与聚合',
    icon: 'newspaper',
    color: '#ec4899',
    repo: 'news',
    installUrl: 'https://github.com/Cecilian-Elysian/news/raw/main/dist/news-ui.user.js',
    version: '>=0.2.0',
    enabled: true,
    requiresCore: true,
    coreUrl: 'https://github.com/Cecilian-Elysian/news/raw/main/dist/news-core.user.js',
  },
]

function getById(id) {
  return REGISTRY.find(s => s.id === id) || null
}

function getByNamespace(namespace) {
  return REGISTRY.find(s => s.namespace === namespace) || null
}

function getEnabled() {
  return REGISTRY.filter(s => s.enabled !== false)
}

function getAll() {
  return REGISTRY.slice()
}

function getIds() {
  return REGISTRY.map(s => s.id)
}

ns.registry = { REGISTRY, getById, getByNamespace, getEnabled, getAll, getIds }

})(CatHub)