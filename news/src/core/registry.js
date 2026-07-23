;(function(ns) {

const _adapterRegistry = {}

function registerAdapter(name, AdapterClass) {
  _adapterRegistry[name] = new AdapterClass()
}

function getAdapter(name) {
  return _adapterRegistry[name]
}

ns.registry = { registerAdapter, getAdapter }
})(NewsAggregator)
