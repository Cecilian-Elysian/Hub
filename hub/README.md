# Cecilian 脚本集 CatHub

> 🐱 Cecilian 家族脚本的统一入口，自动发现已安装的脚本并提供聚合面板

一个基于 [脚本猫](https://docs.scriptcat.org/) 的元脚本（meta userscript），用于统一管理和快速访问同作者开发的所有浏览器脚本。

## 功能特性

- 🔍 **自动发现**：扫描已安装的同源脚本，无需手动注册
- 🎯 **统一入口**：单一浮动按钮 + 极简面板，避免屏幕拥挤
- 📊 **状态聚合**：实时显示各脚本的统计徽标（未读数、总数等）
- 🎨 **品牌家族**：蓝紫粉渐变配色，与 bookmarks/news 视觉统一
- ⌨️ **全局快捷键**：`Alt+Shift+H` 切换面板，`Alt+Shift+1/2` 快速打开第 1/2 个脚本
- 🔄 **接管模式**：可选隐藏子脚本的浮动按钮，UI 更整洁
- 🔌 **智能触发**：监听 `cat-script:loaded` 事件 + 窗口扫描 + 页面可见性变化
- 🌗 **明暗主题**：跟随系统 `prefers-color-scheme` 自动切换

## 架构

单页面脚本，**无需后台**。Hub 本身只负责 UI 与协调，所有数据来源于各子脚本暴露的约定 API。

```
┌─────────────────────────────────────┐
│ 子脚本（bookmarks / news / ...）    │
│   暴露 window.{Namespace}.meta       │
│         .ui.panel.openPanel         │
│         .storage.getStats()         │
│   派发 cat-script:loaded 事件       │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Hub (CatHub)                        │
│   浮动按钮 + 极简面板              │
│   自动发现 + 接管模式              │
└─────────────────────────────────────┘
```

## 子脚本接入规范（约定）

任何脚本只需满足以下约定，即可被 Hub 自动发现并集成：

```js
window.MyScript = {
  meta: {
    id: 'myscript',             // 唯一 ID
    name: '我的脚本',            // 显示名
    icon: 'bookmark',           // Lucide 图标名
    description: '...',
    version: '0.1.0',
  },
  ui: {
    panel: {
      openPanel() { /* 打开面板 */ },
      closePanel() { /* 可选 */ },
    },
  },
  storage: {
    getStats() {                 // 供 Hub 读取徽标数据
      return {
        primary:   { count: 42, label: '未读' },
        secondary: { count: 200, label: '总' },
      }
    },
  },
}
```

并在 init 完成后派发事件：

```js
window.dispatchEvent(new CustomEvent('cat-script:loaded', {
  detail: { id: 'myscript', version: '0.1.0' }
}))
```

最后在 Hub 的 `src/registry.js` 中添加：

```js
{
  id: 'myscript',
  namespace: 'MyScript',
  storageName: 'my-script',
  name: '我的脚本',
  description: '...',
  icon: 'package',
  color: '#3b82f6',
  repo: 'myscript',
  installUrl: 'https://...',
  version: '>=0.1.0',
  enabled: true,
}
```

## 安装

### 1. 安装脚本猫

- Chrome / Edge：[Chrome Web Store](https://chromewebstore.google.com/detail/scriptcat/ndcooeababalnlpkagmmjkbkkoohnbin)
- Firefox：[Firefox Add-ons](https://addons.mozilla.org/firefox/addon/scriptcat/)
- 或前往 [脚本猫官网](https://docs.scriptcat.org/) 下载离线包

### 2. 构建脚本

```bash
cd hub
npm run build
```

构建成功后在 `dist/hub.user.js` 生成单文件产物。**无外部依赖**，纯 `node` 拼接。

### 3. 安装到脚本猫

1. 打开 `dist/hub.user.js`，复制**全部内容**
2. 点击浏览器右上角的脚本猫图标 → **「已安装脚本」**
3. 点击 **「+ 新建脚本」**，粘贴并保存
4. 默认匹配所有网页（`@match *://*/*`）

### 4. 验证安装

打开任意网页，右下角应出现蓝紫粉渐变的 🐱 浮动按钮，点击打开极简面板。

## 使用说明

### 浮动按钮

- 右下角蓝紫粉渐变圆形按钮
- 红色徽标显示各脚本未读总数
- 可拖拽到屏幕任意角

### 极简面板（380px 右滑入）

```
┌─────────────────────────────┐
│ 🐱 脚本集              ✕   │
├─────────────────────────────┤
│ 📑 网址收藏                  │
│ 123 条                       │
│                       [打开] │
│ ─────────                    │
│ 📰 新闻聚合                  │
│ 42 未读 · 200 总             │
│                       [打开] │
│ ─────────                    │
│ 📦 便签（未安装）            │
│                          [安装]│
├─────────────────────────────┤
│ 接管 0/2  │  Alt+Shift+H     │
└─────────────────────────────┘
```

### 脚本猫菜单命令

| 命令 | 说明 |
|---|---|
| 🐱 打开脚本集面板 | 主动打开/关闭面板 |
| 🐱 接管全部脚本 | 一键接管，下次刷新生效 |
| 🐱 恢复全部脚本 | 一键取消接管 |
| 🐱 重置 Hub 数据 | 清空所有 Hub 配置（保留子脚本数据） |

### 全局快捷键

| 快捷键 | 行为 |
|---|---|
| `Alt+Shift+H` | 切换面板 |
| `Alt+Shift+1` | 打开第 1 个已装脚本 |
| `Alt+Shift+2` | 打开第 2 个已装脚本 |

## 配置

默认配置见 [`src/config.js`](src/config.js)：

```js
{
  ui: {
    position: 'bottom-right',     // bottom-right / bottom-left / top-right / top-left
    panelWidth: 380,
    theme: 'auto',                // auto / light / dark
    showBadge: true,              // 是否显示徽标
  },
  takeover: {
    autoTakeoverAll: true,        // 首次启动是否自动接管
    hiddenScripts: [],            // 手动接管列表
  },
  hotkey: {
    togglePanel: 'Alt+Shift+H',
    openFirst: 'Alt+Shift+1',
    openSecond: 'Alt+Shift+2',
  },
  polling: {
    scanInterval: 5000,           // 扫描间隔
    heartbeatInterval: 30000,     // 心跳间隔
    badgeInterval: 30000,         // 徽标刷新间隔
    hubTtl: 7 * 86400000,         // Hub 过期 TTL
  },
}
```

修改后重新 `npm run build` 并更新已安装的脚本。

## 项目结构

```
hub/
├── build.mjs              # 拼接源文件 + 语法检查 + 引用检查
├── package.json           # 无依赖，使用 node --test
├── vitest.config.js
├── src/
│   ├── namespace.js       # window.CatHub = {}
│   ├── constants.js       # EVENTS / STORAGE / UI / TAG
│   ├── config.js          # 默认配置 & get/set
│   ├── registry.js        # 已知脚本元信息
│   ├── core/
│   │   ├── storage.js     # GM_setValue 包装
│   │   ├── takeover.js    # 接管模式 + Hub 活跃度
│   │   ├── detector.js    # 探测 window.{ns} + 打开面板
│   │   ├── badge.js       # 徽标聚合
│   │   └── listener.js    # cat-script:loaded 事件处理
│   ├── utils/
│   │   ├── log.js         # console + GM_log 双输出
│   │   ├── format.js      # 时间/数字/HTML 转义
│   │   ├── notify.js      # GM_notification 去重队列
│   │   └── hotkey.js      # 快捷键注册
│   ├── icons/
│   │   └── lucide.js      # 内嵌 SVG 图标
│   ├── ui/
│   │   ├── floating-btn.js# 渐变浮动按钮（可拖拽）
│   │   ├── script-card.js # 单个脚本卡片
│   │   └── panel.js       # 极简面板（单列）
│   └── entry/
│       └── ui.js          # 页面入口
└── tests/
    ├── setup.js           # mockGM() + resetMock
    ├── storage.test.js
    ├── registry.test.js
    ├── detector.test.js
    ├── format.test.js
    ├── takeover.test.js
    └── integration/
        └── discovery.test.js
```

## 运行测试

```bash
npm test
```

测试覆盖：
- `storage.test.js`：CRUD / 前缀清除 / 列表
- `registry.test.js`：元信息完整性 / 反向查找 / 字段校验
- `detector.test.js`：namespace 探测 / isReady / openScript
- `format.test.js`：时间格式化 / 数字缩写 / HTML 转义
- `takeover.test.js`：Hub TTL / 接管切换 / 过期清理
- `integration/discovery.test.js`：事件总线 + 探测 + 徽标聚合 + 接管流

## 兼容性

- ✅ **脚本猫 (ScriptCat)** — 完整支持
- ❌ **Tampermonkey / Violentmonkey** — 未测试，不保证兼容

支持的浏览器：Chrome、Edge、Firefox 等脚本猫支持的浏览器。

## 工作原理

### 自动发现机制（混合方案）

1. **启动时扫描**：遍历 `registry.js` 中的所有 namespace，探测 `window[ns].meta.id` 是否匹配
2. **事件监听**：监听 `cat-script:loaded` 事件，子脚本 init 完成后派发
3. **页面可见性**：监听 `visibilitychange`，页面切回前台时重新扫描
4. **周期刷新**：徽标数据每 30s 自动刷新

### 接管模式

- Hub 启动时写 `cat-hub:active-ts` 时间戳（心跳每 30s 刷新）
- 子脚本启动时检查 `cat-hub:active-ts`，若 7 天内有效则读 `cat-hub:hidden`
- 若自身 ID 在隐藏列表中，**不创建浮动按钮**，仅暴露 API
- Hub 卸载后 7 天：子脚本自动恢复正常

### 菜单与接管

| 操作 | 立即生效 | 刷新生效 |
|---|---|---|
| 接管/恢复 | ❌ | ✅ |
| 重置数据 | ❌ | ✅ |
| 打开面板 | ✅ | — |

## 常见问题

**Q：Hub 安装后看不到任何卡片？**
A：需要同时安装其他 Cecilian 脚本（如 bookmarks、news），详见 [子脚本接入规范](#子脚本接入规范约定)。

**Q：面板打开后空白？**
A：检查脚本猫是否拦截了 `cat-script:loaded` 事件（极少见），或子脚本版本过旧未实现约定。

**Q：接管后子脚本浮动按钮不消失？**
A：接管生效需**刷新页面**。每次接管/恢复操作会发送通知提醒。

**Q：如何添加新的子脚本？**
A：在 `src/registry.js` 中添加元信息，并在子脚本中实现 [约定 API](#子脚本接入规范约定)。

**Q：Hub 被禁用后子脚本怎么办？**
A：7 天后 Hub 心跳过期，子脚本自动恢复正常显示。

## 更新日志

### 0.1.0 (2026-xx-xx)
- ✨ 初始版本
- 🐱 浮动按钮（蓝紫粉渐变）+ 极简面板（单列 380px）
- 🔍 自动发现：监听 `cat-script:loaded` 事件 + window 扫描 + visibilitychange
- 🎯 接管模式：刷新生效，支持 Hub TTL 7 天过期机制
- 📊 徽标聚合：每 30s 自动刷新
- ⌨️ 全局快捷键：Alt+Shift+H 切换、Alt+Shift+1/2 快速打开
- 🛠️ 内置 4 个工具：定时器、心跳、过期清理、运行时日志
- 🎨 蓝紫粉三色渐变品牌色，呼应 Cecilian 家族配色

## 配套项目

| 项目 | 主色 | 状态 |
|---|---|---|
| [bookmarks](https://github.com/Cecilian-Elysian/bookmarks) | `#3b82f6` 蓝 | ✅ Hub 兼容 |
| [news](https://github.com/Cecilian-Elysian/news) | `#ec4899` 粉 | ✅ Hub 兼容 |
- 🔍 自动发现 + 接管模式
- ⌨️ 全局快捷键
- 🎨 蓝紫粉渐变品牌色

## License

MIT