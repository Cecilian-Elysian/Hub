;(function() {
  if (typeof window !== 'undefined') {
    window.BookmarkLogger = {}
  } else if (typeof globalThis !== 'undefined') {
    globalThis.BookmarkLogger = {}
  } else {
    this.BookmarkLogger = {}
  }
})()