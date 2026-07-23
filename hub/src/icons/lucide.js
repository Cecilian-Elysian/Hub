;(function(ns) {

const SVG_ATTRS = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"'

const ICONS = {
  cat: '<svg class="ch-icon" ' + SVG_ATTRS + '><path d="M12 5c.67 0 1.35.09 2 .26 1.78-2 5.03-2.84 6.42-2.26.43 5.13-.92 8.49-2.42 9.94-.32.31-.66.59-1 .83.05.5.05 1.01 0 1.51-.27 2.5-2.05 4.6-4.41 4.92-1.16.16-2.31.16-3.46 0-2.36-.32-4.14-2.42-4.41-4.92-.05-.5-.05-1.01 0-1.51-.34-.24-.68-.52-1-.83C2.92 11.49 1.57 8.13 2 3c1.39-.58 4.64.26 6.42 2.26.65-.17 1.33-.26 2-.26"/><path d="M9 11.5v.01"/><path d="M15 11.5v.01"/><path d="M11.5 15c-.5-.5-1.5-1-2.5-1s-2 .5-2.5 1"/><path d="M17.5 15c-.5-.5-1.5-1-2.5-1s-2 .5-2.5 1"/></svg>',
  bookmark: '<svg class="ch-icon" ' + SVG_ATTRS + '><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>',
  newspaper: '<svg class="ch-icon" ' + SVG_ATTRS + '><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></svg>',
  bookOpen: '<svg class="ch-icon" ' + SVG_ATTRS + '><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
  stickyNote: '<svg class="ch-icon" ' + SVG_ATTRS + '><path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8z"/><path d="M15 3v4a2 2 0 0 0 2 2h4"/></svg>',
  languages: '<svg class="ch-icon" ' + SVG_ATTRS + '><path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/></svg>',
  wrench: '<svg class="ch-icon" ' + SVG_ATTRS + '><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
  externalLink: '<svg class="ch-icon" ' + SVG_ATTRS + '><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>',
  x: '<svg class="ch-icon" ' + SVG_ATTRS + '><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  package: '<svg class="ch-icon" ' + SVG_ATTRS + '><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>',
  check: '<svg class="ch-icon" ' + SVG_ATTRS + '><polyline points="20 6 9 17 4 12"/></svg>',
  alert: '<svg class="ch-icon" ' + SVG_ATTRS + '><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
}

function get(name) {
  return ICONS[name] || ICONS.package
}

function getAll() {
  return Object.assign({}, ICONS)
}

ns.icons = { get, getAll, ICONS }

})(CatHub)