import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { Marked } from 'marked';
import { decodeHTML } from 'entities';

export const homepageMetadata = {
  title: 'FDE 学习路线：15 阶段企业 AI 项目实战 | StudyFDE',
  description: '面向开发者和产品经理的中文 FDE 学习指南。围绕企业设备报修与工单项目，分 15 个阶段学习 Python、RAG、Agent、系统集成、需求调研、部署与验收交付，附阶段作业。',
  url: 'https://studyfde.github.io/',
  image: 'https://studyfde.github.io/assets/fde-learning-roadmap-1200x630.png',
  imageAlt: 'StudyFDE 中文实战指南：FDE 学习路线，15 阶段走向企业 AI 交付，面向开发者与产品经理。',
};

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

function headingText(tokens) {
  return tokens.map((token) => {
    if (token.type === 'html') return '';
    if (token.type === 'br') return ' ';
    if (token.tokens) return headingText(token.tokens);
    if (token.type === 'codespan' || token.type === 'escape') return token.text;
    return decodeHTML(token.text ?? '');
  }).join('');
}

export function renderPage(markdown, metadata = {}) {
  const headings = [];
  const usedIds = new Set(['main-content']);
  const parser = new Marked({
    renderer: {
      heading({ tokens, depth }) {
        const text = headingText(tokens);
        const slug = text.normalize('NFC').toLowerCase()
          .replace(/[^\p{L}\p{N}\p{M}\s_-]/gu, '')
          .trim().replace(/\s+/g, '-') || 'section';
        let id = slug;
        let suffix = 1;
        while (usedIds.has(id)) id = `${slug}-${suffix++}`;
        usedIds.add(id);
        headings.push({ text, depth, id });
        return `<h${depth} id="${escapeHtml(id)}">${this.parser.parseInline(tokens)}</h${depth}>\n`;
      },
    },
  });
  // README is maintained in this repository; raw HTML follows Markdown semantics.
  const content = parser.parse(markdown);
  const title = headings.find((heading) => heading.depth === 1)?.text ?? 'FDE 学习之路';
  const seo = { ...homepageMetadata, title, ...metadata };
  const chapters = headings.filter(({ depth }) => depth === 2 || depth === 3);
  const navigation = `<nav aria-label="章节目录"><ul class="toc-list">${chapters.map(({ text, depth, id }) =>
    `<li class="toc-level-${depth}"><a href="#${encodeURIComponent(id)}">${escapeHtml(text || '未命名章节')}</a></li>`,
  ).join('\n')}</ul></nav>`;

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="msvalidate.01" content="82FBC3E92E411F82740ED620BE5A7DBA" />
  <meta name="google-site-verification" content="IfEraq8UU0TiEA67mgzJARbrPkJXYs4n18I7llBwom4" />
  <title>${escapeHtml(seo.title)}</title>
  <meta name="description" content="${escapeHtml(seo.description)}">
  <link rel="canonical" href="${escapeHtml(seo.url)}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="StudyFDE">
  <meta property="og:locale" content="zh_CN">
  <meta property="og:title" content="${escapeHtml(seo.title)}">
  <meta property="og:description" content="${escapeHtml(seo.description)}">
  <meta property="og:url" content="${escapeHtml(seo.url)}">
  <meta property="og:image" content="${escapeHtml(seo.image)}">
  <meta property="og:image:type" content="image/png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${escapeHtml(seo.imageAlt)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(seo.title)}">
  <meta name="twitter:description" content="${escapeHtml(seo.description)}">
  <meta name="twitter:image" content="${escapeHtml(seo.image)}">
  <meta name="twitter:image:alt" content="${escapeHtml(seo.imageAlt)}">
  <link rel="stylesheet" href="./github-markdown.css">
  <style>
    :root {
      color-scheme: light;
      --bg-canvas: #f6f5f1;
      --bg-surface: #ffffff;
      --bg-elevated: rgba(255, 255, 255, 0.88);
      --bg-subtle: #f8fafc;
      --text-primary: #18181b;
      --text-secondary: #3f3f46;
      --text-muted: #71717a;
      --border-default: #e4e4e7;
      --border-subtle: #f1f1f4;
      --brand-primary: #1d4ed8;
      --brand-secondary: #4338ca;
      --brand-soft: #eff6ff;
      --brand-soft-hover: #dbeafe;
      --hw-bg: #fffbeb;
      --hw-border: #fde68a;
      --hw-accent: #d97706;
      --hw-text: #92400e;
      --quote-bg: #f0f7ff;
      --quote-border: #3b82f6;
      --shadow-card: 0 12px 36px -8px rgba(24, 24, 27, 0.06), 0 2px 8px -2px rgba(24, 24, 27, 0.04);
      --shadow-float: 0 8px 24px -4px rgba(24, 24, 27, 0.12);
      --article-font-size: 16.5px;
      font-family: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: var(--text-primary);
      background: var(--bg-canvas);
      line-height: 1.8;
      scroll-behavior: smooth;
    }

    html[data-theme="dark"] {
      color-scheme: dark;
      --bg-canvas: #0c0e14;
      --bg-surface: #141821;
      --bg-elevated: rgba(20, 24, 33, 0.88);
      --bg-subtle: #1c2230;
      --text-primary: #f1f5f9;
      --text-secondary: #cbd5e1;
      --text-muted: #94a3b8;
      --border-default: #262e40;
      --border-subtle: #1e2534;
      --brand-primary: #60a5fa;
      --brand-secondary: #818cf8;
      --brand-soft: rgba(59, 130, 246, 0.14);
      --brand-soft-hover: rgba(59, 130, 246, 0.22);
      --hw-bg: rgba(245, 158, 11, 0.08);
      --hw-border: rgba(245, 158, 11, 0.28);
      --hw-accent: #fbbf24;
      --hw-text: #fde68a;
      --quote-bg: rgba(59, 130, 246, 0.09);
      --quote-border: #60a5fa;
      --shadow-card: 0 16px 40px -8px rgba(0, 0, 0, 0.45);
      --shadow-float: 0 10px 28px -4px rgba(0, 0, 0, 0.6);
    }

    html[data-font="large"] {
      --article-font-size: 18px;
    }

    * { box-sizing: border-box; }
    body {
      margin: 0;
      background-color: var(--bg-canvas);
      background-image:
        radial-gradient(at 10% 0%, rgba(29, 78, 216, 0.05) 0px, transparent 45%),
        radial-gradient(at 90% 10%, rgba(217, 119, 6, 0.04) 0px, transparent 45%);
      background-attachment: fixed;
      transition: background-color 0.25s ease, color 0.25s ease;
    }

    /* 顶部阅读进度条 */
    .progress-bar {
      position: fixed;
      top: 0;
      left: 0;
      height: 3.5px;
      width: 0%;
      background: linear-gradient(90deg, var(--brand-primary), #6366f1, #f59e0b);
      z-index: 200;
      transition: width 0.1s ease-out;
    }

    /* 整体双栏书本布局 */
    .layout {
      display: grid;
      grid-template-columns: 300px minmax(0, 880px);
      justify-content: center;
      gap: 40px;
      max-width: 1320px;
      margin: 0 auto;
      padding: 36px 28px 80px;
      align-items: start;
    }

    /* 左侧目录与学习控制台 */
    .sidebar {
      position: sticky;
      top: 28px;
      max-height: calc(100vh - 56px);
      display: flex;
      flex-direction: column;
      overflow-wrap: anywhere;
      padding: 20px 16px;
      background: var(--bg-elevated);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid var(--border-default);
      border-radius: 18px;
      box-shadow: var(--shadow-card);
    }

    .site-title {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
      padding: 2px 8px 14px;
      border-bottom: 1px solid var(--border-subtle);
      color: var(--text-primary);
      font-weight: 800;
      font-size: 17px;
      letter-spacing: -0.01em;
      text-decoration: none;
    }
    .site-title::before {
      content: "🧭";
      font-size: 20px;
    }

    /* 阅读偏好与打卡进度面板 */
    .reader-tools {
      padding: 0 8px 14px;
      margin-bottom: 12px;
      border-bottom: 1px solid var(--border-subtle);
    }
    .tool-row {
      display: flex;
      gap: 8px;
      margin-bottom: 10px;
    }
    .tool-btn {
      flex: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      padding: 6px 10px;
      font-size: 12.5px;
      font-weight: 600;
      color: var(--text-secondary);
      background: var(--bg-subtle);
      border: 1px solid var(--border-default);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .tool-btn:hover {
      color: var(--brand-primary);
      border-color: var(--brand-primary);
      background: var(--brand-soft);
    }
    .hw-tracker {
      font-size: 12px;
      color: var(--text-muted);
    }
    .hw-tracker-head {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
      font-weight: 600;
    }
    .hw-tracker-bar {
      height: 6px;
      background: var(--border-default);
      border-radius: 999px;
      overflow: hidden;
    }
    .hw-tracker-fill {
      height: 100%;
      width: 0%;
      background: linear-gradient(90deg, #10b981, #059669);
      border-radius: 999px;
      transition: width 0.3s ease;
    }

    .toc-label {
      margin: 0 0 8px 10px;
      color: var(--text-muted);
      font-size: 11.5px;
      font-weight: 700;
      letter-spacing: 0.08em;
    }
    .sidebar nav {
      overflow-y: auto;
      padding-right: 4px;
      scrollbar-width: thin;
      scrollbar-color: var(--border-default) transparent;
    }
    .toc-list { list-style: none; margin: 0; padding: 0; }
    .toc-list li { margin: 2px 0; }
    .toc-list a {
      display: block;
      padding: 7px 11px;
      border-radius: 9px;
      color: var(--text-secondary);
      font-size: 13.5px;
      line-height: 1.45;
      font-weight: 500;
      text-decoration: none;
      overflow-wrap: anywhere;
      transition: all 0.15s ease;
    }
    .toc-list a:hover, .toc-list a:focus-visible {
      color: var(--brand-primary);
      background: var(--brand-soft);
    }
    .toc-list a.active {
      color: var(--brand-primary);
      background: var(--brand-soft);
      font-weight: 700;
      box-shadow: inset 3px 0 0 var(--brand-primary);
    }
    .toc-level-3 {
      padding-left: 12px;
      border-left: 1.5px dashed var(--border-default);
      margin-left: 14px !important;
    }
    .toc-level-3 a {
      font-size: 12.5px;
      padding: 4px 10px;
      color: var(--text-muted);
      font-weight: 400;
    }

    /* 正文书页区域 */
    main { min-width: 0; }
    .markdown-body {
      min-width: 0;
      padding: 56px 64px;
      background: var(--bg-surface);
      border: 1px solid var(--border-default);
      border-radius: 22px;
      box-shadow: var(--shadow-card);
      overflow-wrap: anywhere;
      font-size: var(--article-font-size);
      line-height: 1.85;
      color: var(--text-primary);
      transition: background-color 0.25s ease, color 0.25s ease, font-size 0.2s ease;
    }

    .markdown-body p {
      margin-top: 0;
      margin-bottom: 1.15em;
      color: var(--text-secondary);
    }
    .markdown-body strong {
      color: var(--text-primary);
      font-weight: 700;
    }

    .markdown-body :is(h1, h2, h3, h4, h5, h6) {
      scroll-margin-top: 28px;
      color: var(--text-primary);
      letter-spacing: -0.015em;
    }

    /* 顶部主标题海报感设计 */
    .markdown-body h1 {
      font-size: 2.25rem;
      font-weight: 850;
      line-height: 1.25;
      padding-bottom: 24px;
      margin-bottom: 32px;
      border-bottom: 2px solid var(--border-subtle);
      position: relative;
    }
    .markdown-body h1::after {
      content: "面向中国开发者与产品经理的实战通关手册 · 15个阶段从零到企业现场交付";
      display: block;
      margin-top: 12px;
      font-size: 0.95rem;
      font-weight: 500;
      color: var(--text-muted);
      letter-spacing: 0;
    }

    /* 阶段大标题卡片化设计 */
    .markdown-body h2 {
      margin-top: 52px;
      margin-bottom: 20px;
      padding: 14px 20px;
      font-size: 1.42rem;
      font-weight: 800;
      background: linear-gradient(90deg, var(--brand-soft) 0%, transparent 95%);
      border-left: 4.5px solid var(--brand-primary);
      border-bottom: none;
      border-radius: 0 12px 12px 0;
      line-height: 1.4;
    }

    /* 作业标题与普通小标题 */
    .markdown-body h3 {
      margin-top: 32px;
      margin-bottom: 14px;
      font-size: 1.15rem;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .markdown-body h3[id^="作业"], .markdown-body h3[id^="选做作业"] {
      display: flex;
      width: 100%;
      padding: 10px 16px;
      margin-bottom: 0;
      background: var(--hw-bg);
      color: var(--hw-text);
      border: 1px solid var(--hw-border);
      border-bottom: none;
      border-radius: 12px 12px 0 0;
      font-size: 1.05rem;
    }
    .markdown-body h3[id^="作业"]::before, .markdown-body h3[id^="选做作业"]::before {
      content: "🛠️ 实战通关作业（做完可点击打勾记录进度）";
      font-weight: 800;
      font-size: 0.98rem;
    }
    .markdown-body h3[id^="作业"], .markdown-body h3[id^="选做作业"] {
      font-size: 0;
    }

    /* 紧跟在作业标题后面的列表自动变成琥珀色工单卡片 */
    .markdown-body h3[id^="作业"] + ul,
    .markdown-body h3[id^="选做作业"] + ul {
      margin-top: 0;
      margin-bottom: 28px;
      padding: 16px 22px 18px 36px;
      background: var(--hw-bg);
      border: 1px solid var(--hw-border);
      border-top: 1px dashed var(--hw-border);
      border-radius: 0 0 12px 12px;
    }

    /* 可交互打卡作业项 */
    .hw-interactive-list {
      list-style: none !important;
      padding-left: 18px !important;
    }
    .hw-interactive-list > li {
      position: relative;
      padding: 8px 12px 8px 34px;
      margin: 6px 0 !important;
      border-radius: 8px;
      cursor: pointer;
      transition: background-color 0.15s ease;
    }
    .hw-interactive-list > li:hover {
      background: rgba(217, 119, 6, 0.08);
    }
    .hw-interactive-list > li::before {
      content: "";
      position: absolute;
      left: 8px;
      top: 13px;
      width: 17px;
      height: 17px;
      border: 2px solid var(--hw-accent);
      border-radius: 5px;
      background: var(--bg-surface);
      transition: all 0.15s ease;
    }
    .hw-interactive-list > li.hw-done {
      opacity: 0.72;
    }
    .hw-interactive-list > li.hw-done::before {
      background: #10b981;
      border-color: #10b981;
      content: "✓";
      color: #fff;
      font-size: 12px;
      font-weight: 800;
      line-height: 14px;
      text-align: center;
    }

    /* 提示框（经验心法） */
    .markdown-body blockquote {
      margin: 26px 0;
      padding: 18px 22px;
      color: var(--text-primary);
      background: var(--quote-bg);
      border-left: 4px solid var(--quote-border);
      border-radius: 0 14px 14px 0;
    }
    .markdown-body blockquote p:last-child {
      margin-bottom: 0;
    }

    .markdown-body hr {
      height: 1px;
      margin: 44px 0;
      background: linear-gradient(90deg, transparent, var(--border-default), transparent);
      border: 0;
    }

    .markdown-body ul, .markdown-body ol {
      padding-left: 1.6em;
      color: var(--text-secondary);
    }
    .markdown-body > ol > li {
      margin: 12px 0;
      padding-left: 4px;
    }
    .markdown-body li {
      margin: 6px 0;
    }

    .markdown-body code:not(pre code) {
      padding: 0.18em 0.45em;
      font-size: 86%;
      background-color: var(--bg-subtle);
      color: var(--brand-primary);
      border: 1px solid var(--border-default);
      border-radius: 6px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
    .markdown-body pre {
      background-color: #0f172a;
      color: #f8fafc;
      border-radius: 12px;
      padding: 18px 22px;
    }

    .markdown-body a {
      color: var(--brand-primary);
      font-weight: 600;
      text-decoration: underline;
      text-underline-offset: 3px;
    }

    /* 右下角悬浮回到顶部按钮 */
    .back-to-top {
      position: fixed;
      right: 28px;
      bottom: 28px;
      width: 44px;
      height: 44px;
      border-radius: 999px;
      background: var(--bg-surface);
      color: var(--text-primary);
      border: 1px solid var(--border-default);
      box-shadow: var(--shadow-float);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      cursor: pointer;
      opacity: 0;
      pointer-events: none;
      transform: translateY(10px);
      transition: all 0.2s ease;
      z-index: 150;
    }
    .back-to-top.visible {
      opacity: 1;
      pointer-events: auto;
      transform: translateY(0);
    }
    .back-to-top:hover {
      background: var(--brand-primary);
      color: #fff;
      border-color: var(--brand-primary);
    }

    a:focus-visible, summary:focus-visible, button:focus-visible {
      outline: 2px solid var(--brand-primary);
      outline-offset: 3px;
    }
    .skip-link {
      position: fixed;
      top: 10px;
      left: 10px;
      z-index: 300;
      padding: 8px 16px;
      background: var(--bg-surface);
      color: var(--brand-primary);
      border-radius: 8px;
      box-shadow: var(--shadow-float);
      transform: translateY(-160%);
    }
    .skip-link:focus { transform: translateY(0); }

    .mobile-toc { display: none; }

    @media (max-width: 980px) {
      .layout { display: block; padding: 16px 16px 64px; }
      .sidebar { display: none; }
      .mobile-toc {
        display: block;
        position: sticky;
        top: 10px;
        z-index: 90;
        margin-bottom: 16px;
        padding: 12px 16px;
        border: 1px solid var(--border-default);
        border-radius: 14px;
        background: var(--bg-elevated);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        box-shadow: var(--shadow-card);
      }
      .mobile-toc summary { cursor: pointer; font-weight: 700; color: var(--text-primary); }
      .mobile-toc nav { margin-top: 12px; max-height: 55vh; overflow-y: auto; }
      .markdown-body { padding: 32px 24px; border-radius: 16px; }
      .markdown-body h1 { font-size: 1.75rem; }
      .markdown-body h2 { font-size: 1.25rem; padding: 12px 14px; }
    }
    @media (max-width: 480px) {
      .layout { padding: 10px 10px 56px; }
      .markdown-body { padding: 22px 16px; }
      .back-to-top { right: 16px; bottom: 16px; }
    }
  </style>
</head>
<body>
  <div class="progress-bar" id="reading-progress" aria-hidden="true"></div>
  <a class="skip-link" href="#main-content">跳到正文</a>
  <div class="layout">
    <aside class="sidebar" aria-label="章节导航">
      <a class="site-title" href="#main-content">${escapeHtml(title)}</a>
      <div class="reader-tools" aria-label="阅读辅助工具">
        <div class="tool-row">
          <button type="button" class="tool-btn" id="theme-toggle" title="切换日间/夜间护眼模式">🌙 夜间模式</button>
          <button type="button" class="tool-btn" id="font-toggle" title="切换正文大小">🔠 放大字号</button>
        </div>
        <div class="hw-tracker">
          <div class="hw-tracker-head">
            <span>实战作业打卡进度</span>
            <span id="hw-count">0 / 0</span>
          </div>
          <div class="hw-tracker-bar"><div class="hw-tracker-fill" id="hw-fill"></div></div>
        </div>
      </div>
      ${chapters.length ? `<p class="toc-label">章节目录</p>\n      ${navigation}` : ''}
    </aside>
    <main id="main-content" tabindex="-1">
      ${chapters.length ? `<details class="mobile-toc"><summary>章节目录</summary>${navigation}</details>` : ''}
      <article class="markdown-body">
${content}</article>
    </main>
  </div>
  <button type="button" class="back-to-top" id="back-to-top" aria-label="回到顶部" title="回到顶部">↑</button>
  <script>
    (() => {
      const root = document.documentElement;
      const bar = document.getElementById('reading-progress');
      const topBtn = document.getElementById('back-to-top');
      const themeBtn = document.getElementById('theme-toggle');
      const fontBtn = document.getElementById('font-toggle');

      // 1. 夜间模式与字号记忆
      const savedTheme = localStorage.getItem('fde-theme');
      const savedFont = localStorage.getItem('fde-font');
      if (savedTheme === 'dark') {
        root.setAttribute('data-theme', 'dark');
        if (themeBtn) themeBtn.textContent = '☀️ 日间模式';
      }
      if (savedFont === 'large') {
        root.setAttribute('data-font', 'large');
        if (fontBtn) fontBtn.textContent = '🔠 标准字号';
      }

      themeBtn?.addEventListener('click', () => {
        const isDark = root.getAttribute('data-theme') === 'dark';
        if (isDark) {
          root.removeAttribute('data-theme');
          localStorage.setItem('fde-theme', 'light');
          themeBtn.textContent = '🌙 夜间模式';
        } else {
          root.setAttribute('data-theme', 'dark');
          localStorage.setItem('fde-theme', 'dark');
          themeBtn.textContent = '☀️ 日间模式';
        }
      });

      fontBtn?.addEventListener('click', () => {
        const isLarge = root.getAttribute('data-font') === 'large';
        if (isLarge) {
          root.removeAttribute('data-font');
          localStorage.setItem('fde-font', 'normal');
          fontBtn.textContent = '🔠 放大字号';
        } else {
          root.setAttribute('data-font', 'large');
          localStorage.setItem('fde-font', 'large');
          fontBtn.textContent = '🔠 标准字号';
        }
      });

      topBtn?.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });

      // 2. 实战作业可点击打卡（持久化保存在本地浏览器）
      const hwHeadings = document.querySelectorAll('.markdown-body h3[id^="作业"], .markdown-body h3[id^="选做作业"]');
      const hwItems = [];
      let savedChecks = {};
      try {
        savedChecks = JSON.parse(localStorage.getItem('fde-hw-checks') || '{}');
      } catch {}

      hwHeadings.forEach((h3, sectionIdx) => {
        const ul = h3.nextElementSibling;
        if (ul && ul.tagName === 'UL') {
          ul.classList.add('hw-interactive-list');
          Array.from(ul.children).forEach((li, itemIdx) => {
            const key = 'hw-' + sectionIdx + '-' + itemIdx;
            hwItems.push({ li, key });
            if (savedChecks[key]) li.classList.add('hw-done');
            li.addEventListener('click', (e) => {
              if (e.target.tagName === 'A') return;
              li.classList.toggle('hw-done');
              savedChecks[key] = li.classList.contains('hw-done');
              try {
                localStorage.setItem('fde-hw-checks', JSON.stringify(savedChecks));
              } catch {}
              updateHwProgress();
            });
          });
        }
      });

      function updateHwProgress() {
        const total = hwItems.length;
        const done = hwItems.filter(({ li }) => li.classList.contains('hw-done')).length;
        const countEl = document.getElementById('hw-count');
        const fillEl = document.getElementById('hw-fill');
        if (countEl) countEl.textContent = done + ' / ' + total;
        if (fillEl) fillEl.style.width = total > 0 ? Math.round((done / total) * 100) + '%' : '0%';
      }
      updateHwProgress();

      // 3. 阅读进度条与目录高亮联动
      const links = Array.from(document.querySelectorAll('.sidebar .toc-list a'));
      const targets = links.map((link) => {
        const id = decodeURIComponent(link.getAttribute('href')?.slice(1) || '');
        return document.getElementById(id);
      }).filter(Boolean);

      function onScroll() {
        const doc = document.documentElement;
        const total = doc.scrollHeight - doc.clientHeight;
        if (bar) {
          bar.style.width = total > 0 ? Math.min(100, (doc.scrollTop / total) * 100) + '%' : '0%';
        }
        if (topBtn) {
          topBtn.classList.toggle('visible', doc.scrollTop > 400);
        }
        let currentId = '';
        for (const el of targets) {
          if (el.getBoundingClientRect().top <= 130) {
            currentId = el.id;
          } else {
            break;
          }
        }
        links.forEach((link) => {
          const id = decodeURIComponent(link.getAttribute('href')?.slice(1) || '');
          const isActive = Boolean(currentId && id === currentId);
          link.classList.toggle('active', isActive);
        });
      }
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    })();
  </script>
</body>
</html>
`;
}

async function build() {
  const root = new URL('../', import.meta.url);
  const markdown = await readFile(new URL('README.md', root), 'utf8');
  const output = new URL('_site/', root);
  await mkdir(output, { recursive: true });
  await copyFile(new URL('node_modules/github-markdown-css/github-markdown-light.css', root), new URL('github-markdown.css', output));
  await copyFile(new URL('node_modules/github-markdown-css/license', root), new URL('github-markdown-css.LICENSE', output));
  await writeFile(new URL('index.html', output), renderPage(markdown, homepageMetadata), 'utf8');
  await mkdir(new URL('assets/', output), { recursive: true });
  const imagePath = new URL(homepageMetadata.image).pathname.slice(1);
  for (const filename of ['sitemap.xml', 'robots.txt', imagePath]) {
    await copyFile(new URL(filename, root), new URL(filename, output));
  }
  console.log('Built _site/index.html, styles, sitemap.xml, robots.txt and social image');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await build();
}
