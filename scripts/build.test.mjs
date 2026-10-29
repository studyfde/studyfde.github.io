import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';
import { renderPage } from './build.mjs';

const root = new URL('../', import.meta.url);

function articleContent(html) {
  return html.match(/<article>\n([\s\S]*?)<\/article>/)?.[1];
}

test('wraps the complete README in a responsive Chinese HTML document', async () => {
  const markdown = await readFile(new URL('README.md', root), 'utf8');
  const html = renderPage(markdown);

  assert.ok(html.startsWith('<!doctype html>'));
  assert.match(html, /<html lang="zh-CN">/);
  assert.match(html, /<meta charset="utf-8">/);
  assert.match(html, /name="viewport" content="width=device-width, initial-scale=1"/);
  assert.equal(articleContent(html), marked.parse(markdown));
});

test('renders headings, nested lists, links and code without losing content', () => {
  const html = renderPage(`# 中文学习指南

## 第一阶段

### 作业

1. 学习 Python
   - 编写服务

[参考资料](https://example.com/guide)

\`\`\`python
print("<hello>")
\`\`\`
`);

  assert.match(html, /<title>中文学习指南<\/title>/);
  assert.match(html, /<h1>中文学习指南<\/h1>/);
  assert.match(html, /<h2>第一阶段<\/h2>/);
  assert.match(html, /<h3>作业<\/h3>/);
  assert.match(html, /<ol>\s*<li>学习 Python<ul>\s*<li>编写服务<\/li>/);
  assert.match(html, /<a href="https:\/\/example.com\/guide">参考资料<\/a>/);
  assert.match(html, /<pre><code class="language-python">print\(&quot;&lt;hello&gt;&quot;\)/);
});

test('escapes the document title and supplies a fallback when there is no h1', () => {
  assert.match(
    renderPage('# A & B <test> "quoted"'),
    /<title>A &amp; B &lt;test&gt; &quot;quoted&quot;<\/title>/,
  );
  assert.match(renderPage('正文'), /<title>FDE 学习之路<\/title>/);
});

test('renders updated content instead of a hard-coded copy of the README', () => {
  assert.match(renderPage('# 标题\n\n新增内容'), /<p>新增内容<\/p>/);
  assert.doesNotMatch(renderPage('# 标题\n\n替换内容'), /新增内容/);
});

test('builds the actual README regardless of the current working directory', async () => {
  execFileSync(process.execPath, [fileURLToPath(new URL('scripts/build.mjs', root))], {
    cwd: tmpdir(),
    encoding: 'utf8',
  });
  const markdown = await readFile(new URL('README.md', root), 'utf8');
  const html = await readFile(new URL('_site/index.html', root), 'utf8');
  assert.equal(html, renderPage(markdown));
});
