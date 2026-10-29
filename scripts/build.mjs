import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { marked } from 'marked';

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

export function renderPage(markdown) {
  const tokens = marked.lexer(markdown);
  const title = tokens.find((token) => token.type === 'heading' && token.depth === 1)?.text
    ?? 'FDE 学习之路';
  // README is maintained in this repository; raw HTML follows Markdown semantics.
  const content = marked.parser(tokens);

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    :root {
      color-scheme: light;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
      color: #24292f;
      background: #f6f8fa;
      line-height: 1.8;
    }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 40px 20px; }
    main {
      max-width: 900px;
      margin: 0 auto;
      padding: 40px 48px;
      background: #fff;
      border: 1px solid #d0d7de;
      border-radius: 12px;
      overflow-wrap: anywhere;
    }
    h1, h2, h3, h4, h5, h6 { line-height: 1.4; color: #1f2328; }
    h1 { margin-top: 0; font-size: 2rem; }
    h2 { margin-top: 2.2rem; padding-bottom: 0.4rem; border-bottom: 1px solid #d8dee4; font-size: 1.5rem; }
    h3 { margin-top: 1.6rem; font-size: 1.2rem; }
    p, ul, ol { margin-top: 0; margin-bottom: 1rem; }
    ul, ol { padding-left: 1.8rem; }
    li + li { margin-top: 0.3rem; }
    li > ul, li > ol { margin-top: 0.3rem; margin-bottom: 0.5rem; }
    a { color: #0969da; text-underline-offset: 3px; }
    a:hover { text-decoration-thickness: 2px; }
    a:focus-visible { outline: 2px solid #0969da; outline-offset: 3px; }
    code { padding: 0.15em 0.35em; background: #eff1f3; border-radius: 4px; font-size: 0.9em; }
    pre { padding: 16px; overflow-x: auto; background: #f6f8fa; border-radius: 6px; line-height: 1.6; }
    pre code { padding: 0; background: none; }
    blockquote { margin-left: 0; padding-left: 1rem; border-left: 4px solid #d0d7de; color: #57606a; }
    img { max-width: 100%; height: auto; }
    table { display: block; max-width: 100%; overflow-x: auto; border-collapse: collapse; }
    th, td { padding: 6px 12px; border: 1px solid #d0d7de; }
    @media (max-width: 600px) {
      body { padding: 0; }
      main { padding: 24px 20px; border: 0; border-radius: 0; }
      h1 { font-size: 1.7rem; }
      h2 { font-size: 1.3rem; }
    }
  </style>
</head>
<body>
  <main>
    <article>
${content}</article>
  </main>
</body>
</html>
`;
}

async function build() {
  const root = new URL('../', import.meta.url);
  const markdown = await readFile(new URL('README.md', root), 'utf8');
  const output = new URL('_site/', root);
  await mkdir(output, { recursive: true });
  await writeFile(new URL('index.html', output), renderPage(markdown), 'utf8');
  console.log('Built _site/index.html from README.md');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await build();
}
