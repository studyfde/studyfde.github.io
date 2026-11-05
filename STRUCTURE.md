# 站点结构与 Sitemap 维护

## 当前发布结构

正式站点：`https://studyfde.github.io/`

| 发布路径 | 来源 | 用途 | 收入 sitemap |
| --- | --- | --- | --- |
| `/` | `README.md` → `_site/index.html` | FDE 学习指南全文 | 是 |
| `/sitemap.xml` | 根目录 `sitemap.xml`，构建时复制 | 搜索引擎 URL 清单 | 否 |
| `/robots.txt` | 根目录 `robots.txt`，构建时复制 | 抓取规则及 sitemap 地址 | 否 |
| `/assets/fde-learning-roadmap-1200x630.png` | 本地绘制的静态 PNG，构建时复制 | Open Graph / Twitter 分享配图 | 否 |
| `/github-markdown.css` | npm 依赖，构建时复制 | 阅读样式 | 否 |
| `/github-markdown-css.LICENSE` | npm 依赖，构建时复制 | 样式许可证 | 否 |

当前 sitemap 共 **1 个 URL**。十五个阶段和作业是首页的 `#fragment` 锚点，不是独立文档，不应作为单独的 sitemap URL。仓库内的维护文档不由当前构建器发布。

## 设计约定

- 只列 HTTPS 正式页面，不列样式、许可证、404 页面或未上线的规划路径。
- 首页采用 `https://studyfde.github.io/`，不重复列 `/index.html`。
- 暂不提供 `lastmod`：没有建立可靠的内容修改日期来源，不使用构建时间代替内容更新时间。
- 不使用 Google 忽略的 `priority`、`changefreq`。
- `robots.txt` 允许公开页面抓取并声明 sitemap；允许抓取不等于保证收录。

## 构建与验证

```bash
npm ci
npm test
npm run build
```

构建产物位于 `_site/`。现有 GitHub Actions 发布整个目录，无需额外部署步骤。测试覆盖从其他工作目录构建、sitemap/robots/分享图完整复制、元信息一致性及转义、分享图尺寸和文件大小。

发布后检查：

1. `https://studyfde.github.io/sitemap.xml` 返回 200 和有效 XML。
2. `https://studyfde.github.io/robots.txt` 返回 200，并声明上述地址。
3. 在 Google Search Console 和 Bing Webmaster Tools 提交 sitemap 地址，检查处理结果与首页索引状态。页面中已有验证标签，但这不能证明后台验证或收录已完成。

## 首页搜索与分享信息

`scripts/build.mjs` 中的 `homepageMetadata` 统一维护首页 title、description、canonical URL、分享图 URL 和替代文本。构建时生成 Open Graph 和 Twitter 大图卡片标签，canonical 与 sitemap 均使用 `https://studyfde.github.io/`。SEO 标题与正文 H1 分离，README、侧栏标题和章节锚点保持不变。

分享图使用 PNG 以兼顾社交抓取器兼容性，实际尺寸 1200×630、约 126 KiB；图片只用于分享标签，不增加正文加载图片的开销。文件已存入仓库资源目录，常规 npm 构建不需要 Python、字体或外部 API。

如需重新绘制，先准备 Python、Pillow 和合法可用的中文字体，再运行：

```bash
# macOS 示例；其他系统传入自己的中文 TTF/OTF/TTC 字体路径。
python3 -I scripts/generate-social-image.py --font '/System/Library/Fonts/STHeiti Medium.ttc'
```

排版和文字在该脚本中可编辑；更换标题时同步检查配图文字和 `imageAlt`。修改后重新运行测试、构建，并人工检查图片的文字和裁切。

部署后还需确认分享图 URL 返回 200、Content-Type 为 image/png。社交平台可能缓存旧卡片；Open Graph 不保证每个平台，尤其微信，会展示完全相同的分享效果。本轮没有进行线上平台分享验证。

## 新增页面时

1. 先实现对应 HTML 输出及站内链接，确认正式 URL 返回 200、可索引且不是重定向。
2. 为页面确定唯一 canonical，再加入根目录 `sitemap.xml`。调用 `renderPage(markdown, metadata)` 时显式传入该页的 title、description、url、image、imageAlt，不要让独立页面沿用首页 canonical。
3. 更新 `scripts/build.test.mjs` 中目前仅包含首页的 URL 断言，以及本文的页面清单。
4. 若以后建立可靠的内容更新时间来源，可以加入真实 `lastmod`，并调整当前禁止该字段的测试。
5. 更换正式域名时，同步修改 sitemap、robots、相关测试和 canonical（如已实现）。

建议的后续内容结构见 `SEO-STRATEGY.md`。未实际生成和发布的路径不要提前加入 sitemap。
