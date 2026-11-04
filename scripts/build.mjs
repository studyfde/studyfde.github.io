import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { Marked } from 'marked';
import { decodeHTML } from 'entities';

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

export function renderPage(markdown) {
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
  const chapters = headings.filter(({ depth }) => depth === 2 || depth === 3);
  const navigation = `<nav aria-label="章节目录"><ul class="toc-list">${chapters.map(({ text, depth, id }) =>
    `<li class="toc-level-${depth}"><a href="#${encodeURIComponent(id)}">${escapeHtml(text || '未命名章节')}</a></li>`,
  ).join('\n')}</ul></nav>`;

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="./github-markdown.css">
  <style>
    :root {
      color-scheme: light;
      --bg-canvas: #f4f6fb;
      --bg-surface: #ffffff;
      --bg-subtle: #f8fafc;
      --text-primary: #0f172a;
      --text-secondary: #475569;
      --text-muted: #64748b;
      --border-default: #e2e8f0;
      --border-subtle: #eef2f6;
      --brand-primary: #2563eb;
      --brand-secondary: #4f46e5;
      --brand-soft: #eff6ff;
      --brand-border: #bfdbfe;
      --accent-homework-bg: #fffbeb;
      --accent-homework-border: #f59e0b;
      --accent-homework-text: #b45309;
      --shadow-sm: 0 1px 3px rgba(15, 23, 42, 0.04), 0 1px 2px rgba(15, 23, 42, 0.02);
      --shadow-md: 0 10px 30px -5px rgba(15, 23, 42, 0.05), 0 4px 12px -2px rgba(15, 23, 42, 0.03);
      font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Segoe UI", Roboto, sans-serif;
      color: var(--text-primary);
      background: var(--bg-canvas);
      line-height: 1.75;
      scroll-behavior: smooth;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background-image:
        radial-gradient(at 0% 0%, rgba(37, 99, 235, 0.06) 0px, transparent 50%),
        radial-gradient(at 100% 0%, rgba(79, 70, 229, 0.05) 0px, transparent 50%);
      background-attachment: fixed;
    }
    .progress-bar {
      position: fixed;
      top: 0;
      left: 0;
      height: 3px;
      width: 0%;
      background: linear-gradient(90deg, var(--brand-primary), var(--brand-secondary), #06b6d4);
      z-index: 100;
      transition: width 0.1s ease-out;
    }
    .layout {
      display: grid;
      grid-template-columns: 288px minmax(0, 1fr);
      gap: 36px;
      max-width: 1340px;
      margin: 0 auto;
      padding: 36px 28px 64px;
      align-items: start;
    }
    .sidebar {
      position: sticky;
      top: 28px;
      max-height: calc(100vh - 56px);
      overflow-y: auto;
      overflow-wrap: anywhere;
      padding: 20px 16px;
      background: rgba(255, 255, 255, 0.86);
      backdrop-filter: blur(12px);
      border: 1px solid var(--border-default);
      border-radius: 16px;
      box-shadow: var(--shadow-sm);
      scrollbar-width: thin;
      scrollbar-color: #cbd5e1 transparent;
    }
    .site-title {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 16px;
      padding: 4px 8px 14px;
      border-bottom: 1px solid var(--border-subtle);
      color: var(--text-primary);
      font-weight: 700;
      font-size: 17px;
      letter-spacing: -0.01em;
      text-decoration: none;
    }
    .site-title::before {
      content: "🚀";
      font-size: 18px;
    }
    .toc-label {
      margin: 0 0 10px 10px;
      color: var(--text-muted);
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.12em;
    }
    .toc-list { list-style: none; margin: 0; padding: 0; }
    .toc-list li { margin: 2px 0; }
    .toc-list a {
      display: block;
      padding: 7px 10px;
      border-radius: 8px;
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
      transform: translateX(2px);
    }
    .toc-list a.active {
      color: var(--brand-primary);
      background: var(--brand-soft);
      font-weight: 600;
      box-shadow: inset 3px 0 0 var(--brand-primary);
    }
    .toc-level-3 {
      padding-left: 12px;
      border-left: 1.5px dashed #cbd5e1;
      margin-left: 12px !important;
    }
    .toc-level-3 a {
      font-size: 12.5px;
      padding: 4px 10px;
      color: var(--text-muted);
      font-weight: 400;
    }
    main { min-width: 0; }
    .markdown-body {
      min-width: 0;
      padding: 48px 56px;
      background: var(--bg-surface);
      border: 1px solid var(--border-default);
      border-radius: 18px;
      box-shadow: var(--shadow-md);
      overflow-wrap: anywhere;
      font-size: 16px;
      line-height: 1.8;
      color: var(--text-primary);
    }
    .markdown-body :is(h1, h2, h3, h4, h5, h6) {
      scroll-margin-top: 28px;
      color: var(--text-primary);
      letter-spacing: -0.01em;
    }
    .markdown-body h1 {
      font-size: 2.15rem;
      font-weight: 800;
      padding-bottom: 20px;
      margin-bottom: 28px;
      border-bottom: 2px solid var(--border-subtle);
      background: linear-gradient(135deg, #0f172a 0%, #1e40af 60%, #4f46e5 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .markdown-body h2 {
      margin-top: 44px;
      margin-bottom: 18px;
      padding: 12px 18px;
      font-size: 1.4rem;
      font-weight: 700;
      background: linear-gradient(90deg, var(--brand-soft) 0%, rgba(239, 246, 255, 0) 100%);
      border-left: 4px solid var(--brand-primary);
      border-bottom: none;
      border-radius: 0 10px 10px 0;
    }
    .markdown-body h3 {
      margin-top: 26px;
      margin-bottom: 14px;
      font-size: 1.15rem;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .markdown-body h3[id^="作业"], .markdown-body h3[id^="选做作业"] {
      padding: 5px 14px;
      background: var(--accent-homework-bg);
      color: var(--accent-homework-text);
      border: 1px solid rgba(245, 158, 11, 0.35);
      border-left: 4px solid var(--accent-homework-border);
      border-radius: 8px;
    }
    .markdown-body h3[id^="作业"]::before, .markdown-body h3[id^="选做作业"]::before {
      content: "✍️";
      font-size: 1rem;
    }
    .markdown-body :is(h1, h2, h3, h4, h5, h6):target {
      outline: 2px solid rgba(37, 99, 235, 0.25);
      outline-offset: 4px;
    }
    .markdown-body blockquote {
      margin: 22px 0;
      padding: 16px 20px;
      color: #1e293b;
      background: linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%);
      border-left: 4px solid var(--brand-primary);
      border-radius: 0 12px 12px 0;
    }
    .markdown-body hr {
      height: 1px;
      margin: 40px 0;
      background: linear-gradient(90deg, transparent, var(--border-default), transparent);
      border: 0;
    }
    .markdown-body ul, .markdown-body ol {
      padding-left: 1.65em;
    }
    .markdown-body li {
      margin: 6px 0;
    }
    .markdown-body li > p {
      margin-top: 6px;
    }
    .markdown-body code:not(pre code) {
      padding: 0.2em 0.45em;
      font-size: 86%;
      background-color: #f1f5f9;
      color: #0f172a;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
    }
    .markdown-body pre {
      background-color: #0f172a;
      color: #f8fafc;
      border-radius: 12px;
      padding: 18px 20px;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
    }
    .markdown-body pre code {
      color: inherit;
      background: transparent;
    }
    .markdown-body table {
      display: table;
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      margin: 22px 0;
      border: 1px solid var(--border-default);
      border-radius: 12px;
      overflow: hidden;
      font-size: 14.5px;
    }
    .markdown-body table th {
      background: #f8fafc;
      color: var(--text-primary);
      font-weight: 700;
      text-align: left;
      padding: 12px 16px;
      border-bottom: 1px solid var(--border-default);
    }
    .markdown-body table td {
      padding: 12px 16px;
      border-bottom: 1px solid var(--border-subtle);
      vertical-align: top;
    }
    .markdown-body table tr:last-child td {
      border-bottom: none;
    }
    .markdown-body table tr:nth-child(2n) {
      background-color: #fcfdff;
    }
    .markdown-body a {
      color: var(--brand-primary);
      font-weight: 500;
      text-decoration: underline;
      text-underline-offset: 3px;
    }
    a:focus-visible, summary:focus-visible { outline: 2px solid var(--brand-primary); outline-offset: 3px; }
    .skip-link {
      position: fixed;
      top: 10px;
      left: 10px;
      z-index: 200;
      padding: 8px 16px;
      background: #fff;
      color: var(--brand-primary);
      border-radius: 8px;
      box-shadow: var(--shadow-md);
      transform: translateY(-160%);
    }
    .skip-link:focus { transform: translateY(0); }
    .mobile-toc { display: none; }
    @media (max-width: 960px) {
      .layout { display: block; padding: 16px; }
      .sidebar { display: none; }
      .mobile-toc {
        display: block;
        position: sticky;
        top: 10px;
        z-index: 50;
        margin-bottom: 16px;
        padding: 12px 16px;
        border: 1px solid var(--border-default);
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        box-shadow: var(--shadow-sm);
      }
      .mobile-toc summary { cursor: pointer; font-weight: 700; color: var(--text-primary); }
      .mobile-toc nav { margin-top: 12px; max-height: 55vh; overflow-y: auto; }
      .markdown-body { padding: 28px 22px; border-radius: 14px; }
      .markdown-body h1 { font-size: 1.75rem; }
      .markdown-body h2 { font-size: 1.25rem; padding: 10px 14px; }
      .markdown-body table { display: block; overflow-x: auto; }
    }
    @media (max-width: 480px) {
      .layout { padding: 10px; }
      .markdown-body { padding: 20px 16px; font-size: 15px; }
    }
  </style>
</head>
<body>
  <div class="progress-bar" id="reading-progress" aria-hidden="true"></div>
  <a class="skip-link" href="#main-content">跳到正文</a>
  <div class="layout">
    <aside class="sidebar" aria-label="章节导航">
      <a class="site-title" href="#main-content">${escapeHtml(title)}</a>
      ${chapters.length ? `<p class="toc-label">章节目录</p>\n      ${navigation}` : ''}
    </aside>
    <main id="main-content" tabindex="-1">
      ${chapters.length ? `<details class="mobile-toc"><summary>章节目录</summary>${navigation}</details>` : ''}
      <article class="markdown-body">
${content}</article>
    </main>
  </div>
  <script>
    (() => {
      const bar = document.getElementById('reading-progress');
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
        let currentId = '';
        for (const el of targets) {
          if (el.getBoundingClientRect().top <= 120) {
            currentId = el.id;
          } else {
            break;
          }
        }
        links.forEach((link) => {
          const id = decodeURIComponent(link.getAttribute('href')?.slice(1) || '');
          link.classList.toggle('active', Boolean(currentId && id === currentId));
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
  await writeFile(new URL('index.html', output), renderPage(markdown), 'utf8');
  console.log('Built _site/index.html and GitHub Markdown styles from README.md');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await build();
}
