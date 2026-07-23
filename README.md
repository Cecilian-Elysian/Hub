# Cecilian 脚本集

> 🐱 Cecilian 家族用户脚本统一仓库

多个基于 [脚本猫](https://docs.scriptcat.org/) 的用户脚本，统一管理、版本控制和发布。

## 项目列表

| 项目 | 状态 | 描述 |
|---|---|---|
| 📑 [bookmarks/](./bookmarks) | ✅ v0.2.0 | 导入/导出浏览器书签，搜索筛选后导出为 Markdown / JSON / Netscape HTML |
| 📰 [news/](./news) | ✅ v0.2.0 | 多源新闻聚合（知乎、微博、B站、百度热搜 + RSS） |
| 🐱 [hub/](./hub) | ✅ v0.1.0 | 统一入口：自动发现已安装脚本，提供聚合面板 |
| 🧪 [tests/](./tests) | ✅ | 跨项目集成测试 |

## 项目结构

```
cat_Script/
├── bookmarks/      # 网址收藏（Hub 兼容，主色 #3b82f6 蓝）
├── news/           # 新闻聚合（Hub 兼容，主色 #ec4899 粉）
├── hub/            # 统一入口（主色 蓝紫粉三色渐变）
└── tests/          # 跨项目集成测试
```

## 通用工作流

每个子项目是独立 npm 工程（无外部依赖，纯 node 拼接）：

```bash
# 进入任意子项目
cd bookmarks  # 或 news / hub

# 安装依赖（如有）
npm install

# 构建 dist/*.user.js
npm run build

# 运行测试
npm test
```

## Hub 集成

`hub/` 自动发现并集成 `bookmarks/` 与 `news/`：

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

详细规范见 [hub/README.md](./hub#子脚本接入规范约定)。

## 测试

### 子项目单元测试
```bash
cd bookmarks  && npm test   # 55 tests
cd news       && npm test   # 41 tests
cd hub        && npm test   # 46 tests
```

### 跨项目集成测试
```bash
node --test tests/cross-project.test.js   # 11 tests
```

**总计：153 个测试，覆盖所有项目。**

## 兼容性

- ✅ **脚本猫 (ScriptCat)** — 完整支持
- ❌ Tampermonkey / Violentmonkey — 未测试，不保证兼容

## 推送

所有项目统一在此仓库管理。已推送到：https://github.com/Cecilian-Elysian/Hub

## License

MIT