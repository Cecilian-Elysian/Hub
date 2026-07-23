;(function(ns) {

const EVENTS = {
  SCRIPT_LOADED: 'cat-script:loaded',
  HUB_COMMAND: 'cat-hub:command',
  HUB_OPEN: 'cat-hub:open',
  HUB_CLOSE: 'cat-hub:close',
  HUB_TAKEOVER_CHANGED: 'cat-hub:takeover-changed',
}

const STORAGE = {
  CONFIG: 'config',
  FIRST_RUN: 'first-run-done',
  ACTIVE_TS: 'active-ts',
  HIDDEN_SCRIPTS: 'hidden',
  KNOWN_SCRIPTS: 'known-scripts',
}

const TAG = '[CatHub]'

const UI = {
  STORAGE_NAME: 'cat-hub',
  BUTTON_ID: 'cat-hub-floating-btn',
  PANEL_ID: 'cat-hub-panel',
  STYLE_ID: 'cat-hub-style',
  PANEL_WIDTH: 380,
  BUTTON_Z: 2147483647,
  CARD_HEIGHT: 64,
  POLL_INTERVAL: 5000,
  HEARTBEAT_INTERVAL: 30000,
  BADGE_REFRESH_INTERVAL: 30000,
  HUB_TTL: 7 * 86400000,
}

const DEFAULTS_VERSION = 1

ns.constants = { EVENTS, STORAGE, TAG, UI, DEFAULTS_VERSION }

})(CatHub)