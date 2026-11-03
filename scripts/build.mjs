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
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
      color: #1f2328;
      background: #f6f8fa;
      line-height: 1.6;
    }
    * { box-sizing: border-box; }
    body { margin: 0; }
    .layout {
      display: grid;
      grid-template-columns: 260px minmax(0, 1fr);
      gap: 32px;
      max-width: 1280px;
      margin: 0 auto;
      padding: 32px 24px;
      align-items: start;
    }
    .sidebar {
      position: sticky;
      top: 32px;
      max-height: calc(100vh - 64px);
      overflow-y: auto;
      overflow-wrap: anywhere;
      padding: 8px 12px 16px 0;
    }
    .site-title { display: block; margin-bottom: 24px; color: #1f2328; font-weight: 650; font-size: 18px; text-decoration: none; }
    .toc-label { margin: 0 0 12px 12px; color: #59636e; font-size: 12px; font-weight: 600; letter-spacing: 0.1em; }
    .toc-list { list-style: none; margin: 0; padding: 0; }
    .toc-list li { margin: 4px 0; }
    .toc-list a { display: block; padding: 8px 12px; border-radius: 6px; color: #59636e; font-size: 14px; text-decoration: none; overflow-wrap: anywhere; }
    .toc-list a:hover, .toc-list a:focus-visible { color: #0969da; background: #eaeef2; }
    .toc-level-3 { padding-left: 16px; border-left: 1px solid #d1d9e0; margin-left: 12px !important; }
    .toc-level-3 a { font-size: 13px; }
    main { min-width: 0; }
    .markdown-body { min-width: 0; padding: 40px 48px; border: 1px solid #d1d9e0; border-radius: 10px; overflow-wrap: anywhere; }
    .markdown-body :is(h1, h2, h3, h4, h5, h6) { scroll-margin-top: 24px; }
    .markdown-body :is(h1, h2, h3, h4, h5, h6):target { background: #ddf4ff; border-radius: 4px; }
    a:focus-visible, summary:focus-visible { outline: 2px solid #0969da; outline-offset: 3px; }
    .skip-link { position: fixed; top: 8px; left: 8px; z-index: 10; padding: 8px 16px; background: #fff; color: #0969da; transform: translateY(-160%); }
    .skip-link:focus { transform: translateY(0); }
    .mobile-toc { display: none; }
    @media (max-width: 900px) {
      .layout { display: block; padding: 16px; }
      .sidebar { display: none; }
      .mobile-toc { display: block; margin-bottom: 16px; padding: 12px 16px; border: 1px solid #d1d9e0; border-radius: 8px; background: #fff; }
      .mobile-toc summary { cursor: pointer; font-weight: 600; }
      .mobile-toc nav { margin-top: 12px; max-height: 50vh; overflow-y: auto; }
      .markdown-body { padding: 24px; }
    }
    @media (max-width: 480px) {
      .layout { padding: 12px; }
      .markdown-body { padding: 20px 16px; }
    }
  </style>
</head>
<body>
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
