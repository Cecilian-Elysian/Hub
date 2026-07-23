# 网址收藏 BookmarkLogger

> 💜 **Hub 兼容**：本项目已实现 [Cecilian Hub](https://github.com/Cecilian-Elysian/hub) 自动发现约定

一个基于 [脚本猫](https://docs.scriptcat.org/) 的浏览器书签导入工具：导入浏览器导出的 `bookmarks.html`，搜索筛选后导出为 Markdown / JSON / 标准 Netscape 书签 HTML。

## 功能特性

- 📥 **导入浏览器书签**：支持 Chrome / Edge / Firefox / Safari 导出的标准 Netscape `bookmarks.html`，自动保留文件夹层级
- 🧹 **URL 去重**：基于 URL 哈希，相同链接只保留最新一份
- 🔍 **搜索筛选**：按标题、URL、文件夹即时搜索，按文件夹下拉筛选
- 📤 **多格式导出**：
  - Markdown（按文件夹分组，便于贴入笔记）
  - JSON（机器可读，完整元数据）
  - 标准 Netscape 书签 HTML（可重新导入到浏览器）
- 📋 **一键复制 Markdown**：通过脚本猫菜单或面板按钮
- 🖱️ **悬浮按钮 + 侧边栏**：右下角浮动按钮打开 460px 侧边栏，可拖拽
- 🌗 **明暗主题**：跟随系统 `prefers-color-scheme` 自动切换

## 架构

单用户脚本，无后台。所有功能运行在页面脚本中：

| 文件 | 作用 |
|---|---|
| `dist/bookmarks.user.js` | 单个用户脚本（UI + 存储 + 导入/导出） |

不需要后台脚本，因为本工具不抓取任何外部数据，全部本地完成。

## 安装

### 1. 安装脚本猫

- Chrome / Edge：[Chrome Web Store](https://chromewebstore.google.com/detail/scriptcat/ndcooeababalnlpkagmmjkbkkoohnbin)
- Firefox：[Firefox Add-ons](https://addons.mozilla.org/firefox/addon/scriptcat/)
- 或前往 [脚本猫官网](https://docs.scriptcat.org/) 下载离线包

### 2. 构建脚本文件

```bash
git clone https://github.com/Cecilian-Elysian/bookmarks.git
cd bookmarks
npm run build
```

构建成功后在 `dist/` 生成 `bookmarks.user.js`。

> 需要 Node.js 14+。**无外部依赖**，纯 `node` 拼接。

### 3. 安装到脚本猫

1. 点击浏览器右上角的脚本猫图标 → **「已安装脚本」**
2. 点击 **「+ 新建脚本」**
3. 将 `dist/bookmarks.user.js` 的**全部内容**粘贴进去并保存
4. 默认匹配所有网页（`@match *://*/*`），保存后立即生效

### 4. 验证安装

打开任意网页，右下角应出现蓝色 📑 浮动按钮，点击打开侧边栏。

## 使用说明

### 导入书签

1. 在浏览器书签管理器中导出书签：
   - Chrome / Edge：书签管理器 → 右上角 ⋮ → **导出书签**
   - Firefox：书签 → 显示全部书签 → 导入与备份 → **导出书签为 HTML…**
   - Safari：文件 → 导出 → **书签**
2. 打开脚本侧边栏，点击右上角 **「导入」**，选择导出的 `.html` 文件
3. 导入完成后侧边栏显示已收录书签列表

侧边栏会显示 `共 N 条 · M 个文件夹` 统计信息。

### 侧边栏

- **顶部工具栏**：导入 / 导出 / 清空 / 关闭
- **快捷导出栏**：导出 Markdown / 导出 JSON / 导出书签 HTML / 复制 Markdown
- **搜索框**：输入关键词即时过滤（标题、URL、文件夹）
- **文件夹下拉**：筛选特定文件夹（含子文件夹路径）
- **列表项**：点击标题在新标签页打开；点击右侧 × 删除

### 脚本猫菜单命令

| 命令 | 说明 |
|---|---|
| 打开网址收藏面板 | 主动打开侧边栏 |
| 导出 Markdown | 生成 Markdown 并复制到剪贴板 |
| 导出书签 HTML | 下载标准 Netscape 书签 HTML（可重新导入浏览器） |
| 清空所有书签 | 删除所有已导入的书签数据 |

## 配置

默认配置见 [`src/config.js`](src/config.js)：

```js
{
  maxTotalBookmarks: 5000,        // 最大保留书签数
  retentionDays: 365,             // 超过 N 天的书签会被清理（仅基于 addDate）
  import: {
    recursiveFolders: true,       // 递归导入所有子文件夹
    dedupByUrl: true,             // 按 URL 去重（忽略大小写、协议、尾部斜杠、utm 参数）
    defaultImportIdPrefix: 'bm',
  },
  ui: {
    position: 'bottom-right',     // 浮动按钮位置：bottom-right / bottom-left / top-right / top-left
    theme: 'auto',                // auto / light / dark（当前仅 auto）
    maxDisplay: 100,              // 侧边栏单页显示上限
  },
  export: {
    format: 'markdown',           // 默认导出格式
    groupBy: 'folder',            // 分组方式：folder / time
    includeTimestamp: true,       // Markdown 中是否显示添加时间
  },
}
```

修改后需重新运行 `npm run build` 并更新已安装的脚本。

## 项目结构

```
bookmarks/
├── build.mjs              # 构建脚本（拼接源文件）
├── package.json           # 无依赖，使用 node --test
├── vitest.config.js       # vitest 配置
├── src/
│   ├── namespace.js       # window.BookmarkLogger = {}
│   ├── constants.js       # 来源标签
│   ├── config.js          # 默认配置 & get/set
│   ├── entry/
│   │   └── ui.js          # 页面脚本入口（单脚本）
│   ├── core/
│   │   ├── parser.js      # 解析 Netscape bookmarks.html
│   │   ├── dedup.js       # URL 哈希去重
│   │   └── storage.js     # 书签 CRUD
│   ├── utils/
│   │   ├── format.js      # 时间格式化、Markdown/JSON/Netscape HTML 导出
│   │   └── notify.js      # 通知队列
│   └── ui/
│       ├── floating-btn.js# 浮动按钮
│       └── panel.js       # 侧边栏面板（导入/导出/筛选）
├── tests/                 # node:test 单元测试
│   ├── setup.js           # mockGM() + loadBuilt()
│   ├── parser.test.js
│   ├── storage.test.js
│   └── format.test.js
└── dist/                  # 构建产物（gitignored）
    └── bookmarks.user.js
```

## 运行测试

```bash
npm test
```

测试覆盖：

- `parser.test.js`：单条/嵌套/HTML 实体/`ADD_DATE` 转换/TAGS/Chrome 真实样本
- `storage.test.js`：新增/更新/去重/筛选/分页/限额/过期清理/统计
- `format.test.js`：时间格式化/Markdown 分组/JSON 导出/重新解析 Netscape HTML

## 常见问题

**Q：导入后看不到书签？**
A：检查浏览器是否正确导出为 Netscape 格式（不是 JSON 或 CSV），打开文件确认包含 `<!DOCTYPE NETSCAPE-Bookmark-file-1>`。

**Q：如何迁移到另一台浏览器？**
A：在原浏览器导出书签 → 在新浏览器安装本脚本 → 通过面板「导入」导入 → 「导出书签 HTML」→ 在新浏览器的书签管理器中导入生成的 HTML。

**Q：去重规则是什么？**
A：忽略协议（http/https）、域名大小写、尾部斜杠、`utm_*` 系列参数后的 URL 视为相同。

**Q：存储上限是多少？**
A：默认 5000 条，超过后丢弃最早导入的；可通过 `maxTotalBookmarks` 配置。

**Q：导出文件能否再次导入？**
A：可以。导出 Netscape HTML 使用标准格式，可被 Chrome / Edge / Firefox / Safari 的书签管理器导入。

## Hub 集成

本项目已实现 [Cecilian Hub](https://github.com/Cecilian-Elysian/hub) 自动发现约定。

```js
window.BookmarkLogger = {
  meta: {
    id: 'bookmarks',
    name: '网址收藏',
    icon: 'bookmark',
    description: '导入/导出浏览器书签',
    version: '0.2.0',
  },
  ui: { panel: { openPanel() {}, closePanel() {} } },
  storage: {
    getStats() {
      return {
        primary:   { count: 123, label: '条' },
        secondary: { count: 5, label: '文件夹' },
      }
    },
  },
}
```

事件 `cat-script:loaded` 在 init 完成后派发。
Hub 接管：本项目支持 `cat-hub:hidden` 配置，被接管后浮动按钮自动隐藏。

### 切换 Hub 接管

通过脚本猫菜单命令「切换 Hub 接管」可手动切换浮动按钮的可见性，刷新页面生效。

## 更新日志

### 0.2.0 (2026-xx-xx)
- 🎨 主品牌色由 `#1a73e8` 升级为 `#3b82f6`（家族蓝），与 Hub 配色统一
- 🔗 暴露 `meta` 与 `getStats()` API 供 Hub 自动发现
- 🐱 新增 Hub 接管兼容（hub-compat.js），被接管时浮动按钮自动隐藏
- 📤 新增「切换 Hub 接管」菜单命令

### 0.1.0 (2026-xx-xx)
- ✨ 初始版本

## License

MIT