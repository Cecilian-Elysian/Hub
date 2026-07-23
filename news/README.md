# 新闻聚合 NewsAggregator

> 💜 **Hub 兼容**：本项目已实现 [Cecilian Hub](https://github.com/Cecilian-Elysian/hub) 自动发现约定

一个基于 [脚本猫](https://docs.scriptcat.org/) 的多源新闻聚合用户脚本，自动抓取知乎、微博、B 站、百度热搜及自定义 RSS，并通过浏览器右侧的侧边栏统一展示。

## 功能特性

- 📰 **多源聚合**：内置知乎、微博、B 站、百度热搜 4 个数据源，支持添加任意 RSS / Atom 订阅
- 🔄 **自动抓取**：后台脚本常驻运行，每 30 分钟自动刷新一次
- 🧹 **智能去重**：基于 URL 哈希 + 标题相似度，避免重复新闻
- 📌 **收藏与已读**：支持星标收藏、点击标记已读
- 🔍 **关键词搜索**：侧边栏内即时过滤
- 📊 **进度可视化**：抓取时显示各源进度条
- 📝 **周报自动生成**：每周自动汇总过去 7 天的新闻为 Markdown
- 🎨 **明暗主题**：跟随系统 `prefers-color-scheme` 自动切换
- 🖱️ **侧边栏交互**：右侧滑入式 420px 面板，开关不影响页面操作

## 架构

项目由两个用户脚本组成，**必须同时安装**：

| 脚本 | 作用 | 运行位置 |
|---|---|---|
| `news-core.user.js` | 后台抓取引擎、去重、周报生成 | 后台页（`@background`） |
| `news-ui.user.js` | 浮动按钮 + 侧边栏 UI | 所有网页（`@match *://*/*`） |

两者通过脚本猫的 `GM_setValue` / `GM_addValueChangeListener` 共享存储进行通信。

## 安装

### 1. 安装脚本猫

- Chrome / Edge：[Chrome Web Store](https://chromewebstore.google.com/detail/scriptcat/ndcooeababalnlpkagmmjkbkkoohnbin)
- Firefox：[Firefox Add-ons](https://addons.mozilla.org/firefox/addon/scriptcat/)
- 或前往 [脚本猫官网](https://docs.scriptcat.org/) 下载离线包

### 2. 构建脚本文件

本仓库仅包含源代码，需先通过 `build.mjs` 拼接出最终的用户脚本：

```bash
git clone https://github.com/Cecilian-Elysian/news.git
cd news
node build.mjs
```

构建成功后会在 `dist/` 目录生成：

- `dist/news-core.user.js`（后台脚本）
- `dist/news-ui.user.js`（页面脚本）

> 需要 Node.js 14+。

### 3. 安装到脚本猫

#### 安装后台脚本（news-core）

1. 点击浏览器右上角的脚本猫图标 → **「后台脚本」** 标签页
2. 点击 **「+ 新建脚本」**
3. 将 `dist/news-core.user.js` 的**全部内容**粘贴进去并保存
4. 确保后台脚本列表中该脚本处于**已启用**状态

#### 安装页面脚本（news-ui）

1. 点击脚本猫图标 → **「已安装脚本」** 标签页
2. 点击 **「+ 新建脚本」**
3. 将 `dist/news-ui.user.js` 的**全部内容**粘贴进去并保存
4. 脚本默认匹配所有网页，安装后立即生效

### 4. 验证安装

- 打开任意网页（如 `https://www.baidu.com`），右下角应出现蓝色 📰 浮动按钮
- 点击脚本猫菜单，应能看到「打开新闻面板 / 手动刷新 / 生成周报 / 清空所有新闻」四个命令
- 首次打开面板时会显示「暂无新闻，点击刷新获取」，等待几分钟后数据会出现

## 使用说明

### 浮动按钮

- 位于页面右下角，可拖拽到任意位置
- 红色徽标显示未读新闻数量
- 点击打开右侧侧边栏；面板打开时按钮自动隐藏

### 侧边栏

- **顶部工具栏**：刷新 / 周报 / 设置 / 关闭
- **搜索框**：输入关键词即时过滤标题
- **标签栏**：按数据源切换（全部 / 知乎 / 微博 / B 站 / 百度 / 订阅 / 收藏）
- **新闻列表**：
  - 左侧圆点 = 未读（蓝色）/ 已读（透明）
  - 点击标题在新标签页打开原文
  - 点击右侧 ☆ 切换收藏

### 脚本猫菜单命令

| 命令 | 说明 |
|---|---|
| 打开新闻面板 | 主动打开侧边栏 |
| 手动刷新 | 立即触发一次全源抓取 |
| 生成周报 | 立即生成本周 Markdown 周报（自动复制到剪贴板） |
| 清空所有新闻 | 删除所有已抓取的新闻数据 |

## 配置

默认配置见 [`src/config.js`](src/config.js)：

```js
{
  fetchInterval: 30,              // 自动抓取间隔（分钟，实际固定为 30）
  maxArticlesPerSource: 100,      // 每个数据源最多保留条数
  maxTotalArticles: 2000,         // 全局最多保留条数
  retentionDays: 30,              // 新闻保留天数
  keywords: [],                   // 关键词提醒列表（未实现）
  blacklist: [],                  // 屏蔽词列表（未实现）
  digestDay: 1,                   // 周报生成日（1=周一）
  digestHour: 8,                  // 周报生成时间
  sources: {
    zhihu:    { enabled: true, order: 0 },
    weibo:    { enabled: true, order: 1 },
    bilibili: { enabled: true, order: 2 },
    baidu:    { enabled: true, order: 3 },
    rss:      { enabled: false, order: 10, urls: [] },
  },
  ui: {
    position: 'bottom-right',    // 浮动按钮位置
    maxDisplay: 50,
    theme: 'auto',                // auto / light / dark
  },
}
```

修改后需要重新运行 `node build.mjs` 并更新已安装的脚本。

## 项目结构

```
news/
├── build.mjs              # 构建脚本（拼接源文件）
├── src/
│   ├── config.js          # 默认配置 & get/set
│   ├── entry/
│   │   ├── core.js        # 后台脚本入口
│   │   └── ui.js          # 页面脚本入口
│   ├── core/
│   │   ├── storage.js     # 文章 CRUD
│   │   ├── dedup.js       # 去重
│   │   ├── registry.js    # 适配器注册
│   │   └── scheduler.js   # 并行抓取调度
│   ├── utils/
│   │   ├── format.js      # 时间格式化、HTML 转义、周报 Markdown
│   │   └── notify.js      # 通知队列
│   ├── ui/
│   │   ├── floating-btn.js# 浮动按钮
│   │   └── panel.js       # 侧边栏面板
│   └── adapters/
│       ├── base.js
│       ├── zhihu.js
│       ├── weibo.js
│       ├── bilibili.js
│       ├── baidu.js
│       └── rss.js
└── dist/                  # 构建产物（gitignored）
    ├── news-core.user.js
    └── news-ui.user.js
```

## 添加新数据源

1. 在 `src/adapters/` 下新建适配器文件，继承 `BaseAdapter`：

```js
class MyAdapter extends BaseAdapter {
  static name = 'mysource'
  static displayName = '我的数据源'

  async fetch() {
    const resp = await this.request('https://example.com/api')
    return resp.list.map(item => ({
      id: item.id,
      title: item.title,
      url: item.url,
      publishTime: item.time,
    }))
  }
}
```

2. 在 `src/entry/core.js` 中注册：

```js
registerAdapter('mysource', MyAdapter)
```

3. 在 `src/config.js` 的 `sources` 中添加配置项
4. 在 `src/ui/panel.js` 的标签栏 HTML 中添加对应 tab
5. 在 `build.mjs` 的 `CORE_ONLY` 数组中加入新文件路径
6. 重新运行 `node build.mjs`

## 常见问题

**Q：侧边栏打不开？**
A：检查两个脚本都已启用，且页面刷新后右下角出现蓝色浮动按钮。

**Q：数据源抓取失败？**
A：打开脚本猫 → 后台脚本，查看 `GM_log` 输出，常见原因是目标站点 API 变更或 IP 频率限制。

**Q：如何重置所有数据？**
A：脚本猫菜单 → 「清空所有新闻」。

**Q：周报什么时候生成？**
A：首次安装满 7 天后自动生成，也可在菜单中手动触发。

## Hub 集成

本项目已实现 [Cecilian Hub](https://github.com/Cecilian-Elysian/hub) 自动发现约定。

```js
window.NewsAggregator = {
  meta: {
    id: 'news',
    name: '新闻聚合',
    icon: 'newspaper',
    description: '多源新闻抓取与聚合',
    version: '0.2.0',
  },
  ui: { panel: { openPanel() {}, closePanel() {} } },
  storage: {
    getStats() {
      return {
        primary:   { count: 42, label: '未读' },
        secondary: { count: 200, label: '总' },
      }
    },
  },
}
```

事件 `cat-script:loaded` 在 UI 脚本 init 完成后派发（后台脚本不派发）。
Hub 接管：本项目支持 `cat-hub:hidden` 配置，被接管后浮动按钮自动隐藏。

### 切换 Hub 接管

通过脚本猫菜单命令「切换 Hub 接管」可手动切换浮动按钮的可见性，刷新页面生效。

## 更新日志

### 0.2.0 (2026-xx-xx)
- 🎨 主品牌色由 `#1a73e8` 升级为 `#ec4899`（家族粉），与 Hub 配色统一
- 🔗 暴露 `meta` 与 `getStats()` API 供 Hub 自动发现
- 🐱 新增 Hub 接管兼容（hub-compat.js），被接管时浮动按钮自动隐藏
- 📤 新增「切换 Hub 接管」菜单命令

### 0.1.0 (2026-xx-xx)
- ✨ 初始版本

## License

MIT
