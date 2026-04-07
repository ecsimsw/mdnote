#!/usr/bin/env node

import fs from "fs";
import path from "path";
import os from "os";
import { execSync } from "child_process";
import { marked } from "marked";

const CSS = `
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');

  * { margin: 0; padding: 0; box-sizing: border-box; }
  html { font-size: 16px; -webkit-font-smoothing: antialiased; }

  body {
    font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
    color: #222;
    background: #fff;
    line-height: 1.8;
    transition: background 0.3s, color 0.3s;
  }

  body.dark {
    background: #1a1a1a;
    color: #ddd;
  }

  article {
    max-width: 780px;
    margin: 0 auto;
    padding: 72px 24px 96px;
  }

  article > :first-child { margin-top: 0; }

  h1 {
    font-size: 22px; font-weight: 700; line-height: 1.35;
    color: #111; margin: 52px 0 16px; letter-spacing: -0.3px;
    border-bottom: 1px solid #eee; padding-bottom: 12px;
  }

  h2 {
    font-size: 19px; font-weight: 700;
    margin: 44px 0 12px; color: #111;
  }

  h3 {
    font-size: 17px; font-weight: 700;
    margin: 36px 0 8px; color: #111;
  }

  h4 {
    font-size: 15px; font-weight: 600;
    margin: 28px 0 6px; color: #555;
  }

  body.dark h1, body.dark h2, body.dark h3 { color: #eee; border-color: #333; }
  body.dark h4 { color: #aaa; }

  p {
    margin-bottom: 4px;
    font-size: 15.5px;
    color: #333;
    word-break: keep-all;
  }

  body.dark p, body.dark li { color: #ccc; }

  hr {
    border: none; border-top: 1px solid #eee; margin: 40px 0;
  }

  body.dark hr { border-color: #333; }

  ul, ol {
    margin: 14px 0; padding-left: 22px;
  }

  li {
    margin-bottom: 6px; font-size: 15.5px; color: #333;
  }

  strong { color: #111; }
  body.dark strong { color: #fff; }

  code {
    font-family: 'SF Mono', 'Consolas', 'Liberation Mono', monospace;
    background: #f3f3f3; padding: 1px 5px; border-radius: 3px;
    font-size: 0.88em; color: #333;
  }

  body.dark code { background: #2a2a2a; color: #ccc; }

  pre {
    position: relative;
    background: #f7f7f7;
    border: 1px solid #e8e8e8;
    border-radius: 6px;
    padding: 18px 20px;
    margin: 24px 0;
    overflow-x: auto;
    font-size: 13.5px;
    line-height: 1.65;
  }

  body.dark pre { background: #252525; border-color: #333; }

  pre code {
    background: none; padding: 0; border-radius: 0;
    font-size: inherit; color: #333;
  }

  body.dark pre code { color: #ccc; }

  .copy-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    background: rgba(0,0,0,0.05);
    border: none;
    border-radius: 6px;
    padding: 4px 10px;
    font-size: 12px;
    color: #8e8e93;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.15s;
    font-family: inherit;
  }

  pre:hover .copy-btn { opacity: 1; }
  .copy-btn:hover { background: rgba(0,0,0,0.1); }
  body.dark .copy-btn { background: rgba(255,255,255,0.1); color: #aaa; }
  body.dark .copy-btn:hover { background: rgba(255,255,255,0.15); }

  blockquote {
    border-left: 2px solid #ddd;
    padding: 10px 18px; margin: 24px 0; color: #666;
    font-size: 14px;
  }

  body.dark blockquote { border-color: #444; color: #999; }

  table {
    width: 100%; border-collapse: collapse;
    margin: 24px 0; font-size: 15px; color: #333;
  }

  th, td {
    border: 1px solid #e0e0e0;
    padding: 10px 14px; text-align: left; line-height: 1.6;
  }

  th { background: #f7f7f7; font-weight: 600; }
  tr:nth-child(even) td { background: #fafafa; }

  body.dark table { color: #ccc; }
  body.dark th, body.dark td { border-color: #333; }
  body.dark th { background: #252525; }
  body.dark tr:nth-child(even) td { background: #222; }

  /* Space theme */
  body.space { background: #0d1117; color: #c9d1d9; }
  body.space h1, body.space h2, body.space h3 { color: #58a6ff; border-color: #21262d; }
  body.space h4 { color: #8b949e; }
  body.space p, body.space li { color: #c9d1d9; }
  body.space strong { color: #f0f6fc; }
  body.space hr { border-color: #21262d; }
  body.space code { background: #161b22; color: #c9d1d9; }
  body.space pre { background: #161b22; border-color: #21262d; }
  body.space pre code { color: #c9d1d9; }
  body.space blockquote { border-color: #30363d; color: #8b949e; }
  body.space table { color: #c9d1d9; }
  body.space th, body.space td { border-color: #21262d; }
  body.space th { background: #161b22; }
  body.space tr:nth-child(even) td { background: #0d1117; }
  body.space .toc a:hover { color: #c9d1d9; }
  body.space .toc a.active { color: #58a6ff; }
  body.space .toolbar { background: rgba(22,27,34,0.85); box-shadow: 0 1px 4px rgba(0,0,0,0.4), 0 0 0 0.5px rgba(255,255,255,0.04); }
  body.space .toolbar button { color: #8b949e; }
  body.space .toolbar button:hover { background: rgba(255,255,255,0.06); }
  body.space .toolbar .divider { background: rgba(255,255,255,0.06); }
  body.space .toolbar .search-input { background: rgba(0,0,0,0.3); border-color: #30363d; color: #c9d1d9; }
  body.space .copy-btn { background: rgba(255,255,255,0.08); color: #8b949e; }
  body.space .copy-btn:hover { background: rgba(255,255,255,0.12); }
  body.space mark.highlight { background: #2a4a2e; }

  /* TOC sidebar */
  .toc {
    position: fixed;
    top: 72px;
    width: 160px;
    max-height: calc(100vh - 120px);
    overflow-y: auto;
    font-size: 14px;
    z-index: 1000;
  }

  .toc ul { list-style: none; padding: 0; margin: 0; }
  .toc li { margin: 0; padding: 0; }

  .toc a {
    display: block;
    padding: 3px 0;
    color: #999;
    text-decoration: none;
    transition: color 0.15s;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .toc a:hover { color: #666; }
  .toc a.active { color: #555; font-weight: 500; }
  body.dark .toc a:hover { color: #aaa; }
  body.dark .toc a.active { color: #bbb; font-weight: 500; }

  .toc .toc-h2 { padding-left: 5px; font-size: 12px; }
  .toc .toc-h3 { padding-left: 10px; font-size: 11px; }

  /* Right toolbar */
  .toolbar {
    position: fixed;
    top: 72px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    background: rgba(255,255,255,0.75);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    padding: 8px;
    border-radius: 14px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.08), 0 0 0 0.5px rgba(0,0,0,0.06);
    z-index: 1000;
  }

  body.dark .toolbar {
    background: rgba(40,40,40,0.85);
    box-shadow: 0 1px 4px rgba(0,0,0,0.3), 0 0 0 0.5px rgba(255,255,255,0.06);
  }

  .toolbar .row {
    display: flex;
    gap: 2px;
    align-items: center;
    justify-content: center;
  }

  .toolbar .row-label {
    font-size: 10px;
    color: #aaa;
    text-align: center;
    user-select: none;
    padding: 2px 0 0;
  }

  .toolbar .brand {
    font-size: 11px;
    color: #aaa;
    text-align: center;
    user-select: none;
    padding: 2px 0 6px;
    font-weight: 600;
    letter-spacing: -0.2px;
  }

  .toolbar .brand a {
    color: inherit;
    text-decoration: none;
  }

  .toolbar .brand a:hover { text-decoration: underline; }

  .toolbar button {
    background: transparent;
    color: #8e8e93;
    border: none;
    padding: 4px 8px;
    border-radius: 8px;
    font-size: 11px;
    font-family: inherit;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
    min-width: 28px;
  }

  .toolbar button.active-theme {
    background: rgba(0,0,0,0.07);
    color: #666;
  }

  body.dark .toolbar button.active-theme {
    background: rgba(255,255,255,0.12);
    color: #eee;
  }

  body.space .toolbar button.active-theme {
    background: rgba(88,166,255,0.15);
    color: #58a6ff;
  }

  .toolbar button:hover { background: rgba(0,0,0,0.05); }
  .toolbar button:active { background: rgba(0,0,0,0.08); }
  body.dark .toolbar button { color: #999; }
  body.dark .toolbar button:hover { background: rgba(255,255,255,0.08); }

  .toolbar .val {
    font-size: 11px;
    color: #8e8e93;
    min-width: 36px;
    text-align: center;
    user-select: none;
    font-weight: 500;
  }

  .toolbar .divider {
    height: 1px;
    background: rgba(0,0,0,0.08);
    margin: 2px 0;
  }

  body.dark .toolbar .divider { background: rgba(255,255,255,0.08); }

  .toolbar .search-input {
    width: 100%;
    border: 1px solid #ddd;
    border-radius: 6px;
    padding: 3px 6px;
    font-size: 10px;
    font-family: inherit;
    outline: none;
    background: rgba(255,255,255,0.5);
    color: #333;
  }

  .toolbar .search-input:focus { border-color: #999; }
  body.dark .toolbar .search-input { background: rgba(0,0,0,0.3); border-color: #444; color: #ddd; }

  .replace-row {
    display: flex;
    gap: 4px;
    align-items: center;
    margin-top: 4px;
  }

  .replace-row .replace-input { flex: 1; }

  .replace-row .replace-btn {
    background: transparent;
    border: 1px solid #ddd;
    border-radius: 6px;
    padding: 4px 8px;
    font-size: 11px;
    color: #8e8e93;
    cursor: pointer;
    font-family: inherit;
    white-space: nowrap;
  }

  .replace-row .replace-btn:hover { background: rgba(0,0,0,0.05); }
  body.dark .replace-row .replace-btn { border-color: #444; color: #999; }
  body.dark .replace-row .replace-btn:hover { background: rgba(255,255,255,0.08); }
  body.space .replace-row .replace-btn { border-color: #30363d; color: #8b949e; }
  body.space .replace-row .replace-btn:hover { background: rgba(255,255,255,0.06); }

  mark.highlight { background: #fff3aa; color: inherit; padding: 0; border-radius: 2px; }
  body.dark mark.highlight { background: #665d20; }

  @media print {
    html { font-size: 5pt; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
    article { max-width: none; padding: 0; margin: 0; }
    h1, h2, h3 { page-break-after: avoid; }
    pre { white-space: pre-wrap; word-wrap: break-word; }
    .toolbar, .toc, .copy-btn { display: none !important; }
  }

  @page { margin: 1.5cm; size: A4; }
`;

function buildHtml(mdContent, title) {
  const body = marked(mdContent);
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>${CSS}</style>
</head>
<body>
  <nav class="toc" id="toc"></nav>
  <div class="toolbar">
    <div class="brand"><a href="https://github.com/ecsimsw/mdviewer">MdViewer</a></div>
    <input type="text" class="search-input" id="searchInput" placeholder="Search..." oninput="doSearch(this.value)">
    <div class="replace-row">
      <input type="text" class="search-input replace-input" id="replaceInput" placeholder="Replace...">
      <button class="replace-btn" onclick="doReplace()">All</button>
    </div>
    <div class="divider"></div>
    <div class="row-label">Zoom</div>
    <div class="row">
      <button onclick="zoom(-10)">\u2212</button>
      <span class="val" id="zoomLabel">100%</span>
      <button onclick="zoom(10)">+</button>
    </div>
    <div class="divider"></div>
    <div class="row-label">Width</div>
    <div class="row">
      <button onclick="resizeWidth(-100)">\u2190</button>
      <span class="val" id="widthLabel">780</span>
      <button onclick="resizeWidth(100)">\u2192</button>
    </div>
    <div class="divider"></div>
    <div class="row-label">Theme</div>
    <div class="row">
      <button onclick="setTheme('light')" id="themeLight" class="active-theme">Light</button>
      <button onclick="setTheme('dark')" id="themeDark">Dark</button>
      <button onclick="setTheme('space')" id="themeSpace">Space</button>
    </div>
    <div class="divider"></div>
    <div class="row-label">Download</div>
    <div class="row">
      <button onclick="downloadPdf()">PDF</button>
      <button onclick="downloadMd()">MD</button>
      <button onclick="downloadTxt()">TXT</button>
    </div>
  </div>
  <article id="content">${body}</article>
  <script>
    // Layout
    let scale = 100;
    let width = 780;
    const content = document.getElementById('content');
    const toc = document.getElementById('toc');
    const toolbar = document.querySelector('.toolbar');

    function updatePositions() {
      var effectiveWidth = width * (scale / 100);
      var half = effectiveWidth / 2;
      toc.style.left = 'calc(50% - ' + (half + 320) + 'px)';
      toolbar.style.left = 'calc(50% + ' + (half + 120) + 'px)';
    }

    function zoom(d) {
      scale = Math.max(50, Math.min(200, scale + d));
      content.style.zoom = scale / 100;
      document.getElementById('zoomLabel').textContent = scale + '%';
      updatePositions();
    }

    function resizeWidth(d) {
      width = Math.max(480, Math.min(1400, width + d));
      content.style.maxWidth = width + 'px';
      document.getElementById('widthLabel').textContent = width;
      updatePositions();
    }

    updatePositions();

    // Theme
    function setTheme(t) {
      document.body.className = t === 'light' ? '' : t;
      document.querySelectorAll('#themeLight,#themeDark,#themeSpace').forEach(function(b) {
        b.classList.remove('active-theme');
      });
      document.getElementById('theme' + t.charAt(0).toUpperCase() + t.slice(1)).classList.add('active-theme');
    }

    // TOC
    (function buildToc() {
      const headings = content.querySelectorAll('h1, h2, h3');
      if (headings.length === 0) return;
      const toc = document.getElementById('toc');
      const ul = document.createElement('ul');
      headings.forEach(function(h, i) {
        h.id = 'heading-' + i;
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = '#heading-' + i;
        a.textContent = h.textContent;
        a.className = 'toc-' + h.tagName.toLowerCase();
        a.addEventListener('click', function(e) {
          e.preventDefault();
          h.scrollIntoView({ behavior: 'smooth' });
        });
        li.appendChild(a);
        ul.appendChild(li);
      });
      toc.appendChild(ul);

      // Highlight active heading on scroll
      var tocLinks = toc.querySelectorAll('a');
      window.addEventListener('scroll', function() {
        var current = '';
        headings.forEach(function(h) {
          if (h.getBoundingClientRect().top <= 100) current = h.id;
        });
        tocLinks.forEach(function(a) {
          a.classList.toggle('active', a.getAttribute('href') === '#' + current);
        });
      });
    })();

    // Code copy buttons
    document.querySelectorAll('pre').forEach(function(pre) {
      var btn = document.createElement('button');
      btn.className = 'copy-btn';
      btn.textContent = 'Copy';
      btn.addEventListener('click', function() {
        var code = pre.querySelector('code');
        navigator.clipboard.writeText(code ? code.textContent : pre.textContent);
        btn.textContent = 'Copied!';
        setTimeout(function() { btn.textContent = 'Copy'; }, 1500);
      });
      pre.appendChild(btn);
    });

    // Search & Replace
    var originalHTML = content.innerHTML;
    function doSearch(query) {
      content.innerHTML = originalHTML;
      if (!query) return;
      highlightText(query);
    }
    function highlightText(query) {
      var walk = document.createTreeWalker(content, NodeFilter.SHOW_TEXT);
      var nodes = [];
      while (walk.nextNode()) nodes.push(walk.currentNode);
      var regex = new RegExp('(' + query.replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\\\$&') + ')', 'gi');
      nodes.forEach(function(node) {
        if (node.parentNode.tagName === 'SCRIPT' || node.parentNode.tagName === 'STYLE') return;
        if (!regex.test(node.textContent)) return;
        var span = document.createElement('span');
        span.innerHTML = node.textContent.replace(regex, '<mark class="highlight">$1</mark>');
        node.parentNode.replaceChild(span, node);
      });
    }
    function doReplace() {
      var search = document.getElementById('searchInput').value;
      var replace = document.getElementById('replaceInput').value;
      if (!search) return;
      content.innerHTML = originalHTML;
      var regex = new RegExp(search.replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\\\$&'), 'gi');
      var walk = document.createTreeWalker(content, NodeFilter.SHOW_TEXT);
      var nodes = [];
      while (walk.nextNode()) nodes.push(walk.currentNode);
      nodes.forEach(function(node) {
        if (node.parentNode.tagName === 'SCRIPT' || node.parentNode.tagName === 'STYLE') return;
        if (regex.test(node.textContent)) {
          node.textContent = node.textContent.replace(regex, replace);
        }
      });
      originalHTML = content.innerHTML;
      document.getElementById('searchInput').value = '';
      document.getElementById('replaceInput').value = '';
    }

    // Download PDF (always Light mode)
    function downloadPdf() {
      var prev = document.body.className;
      document.body.className = '';
      window.print();
      document.body.className = prev;
    }

    // Download MD
    function downloadMd() {
      downloadFile(content.innerText, document.title + '.md', 'text/markdown');
    }

    // Download TXT
    function downloadTxt() {
      downloadFile(content.innerText, document.title + '.txt', 'text/plain');
    }

    function downloadFile(text, filename, type) {
      var blob = new Blob([text], { type: type });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
    }
  </script>
</body>
</html>`;
}

function openBrowser(filePath) {
  const platform = os.platform();
  const cmd = platform === "darwin" ? "open" : platform === "win32" ? "start" : "xdg-open";
  execSync(`${cmd} "${filePath}"`);
}

function convert(inputPath, outDir) {
  if (!fs.existsSync(inputPath)) {
    console.error(`File not found: ${inputPath}`);
    process.exit(1);
  }

  const rawMd = fs.readFileSync(inputPath, "utf-8");
  const baseName = path.basename(inputPath, ".md");
  const inputDir = path.dirname(path.resolve(inputPath));
  fs.mkdirSync(outDir, { recursive: true });

  // Convert relative image paths to absolute file:// URLs
  const md = rawMd.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, src) => {
    if (/^https?:\/\/|^file:\/\/|^\//.test(src)) return match;
    const absPath = path.resolve(inputDir, src);
    return `![${alt}](file://${absPath})`;
  });

  const html = buildHtml(md, baseName);
  const htmlPath = path.join(outDir, `${baseName}.html`);
  fs.writeFileSync(htmlPath, html);

  openBrowser(htmlPath);
  console.log(htmlPath);

  // 임시 파일이면 브라우저 로딩 후 삭제
  if (outDir.startsWith(os.tmpdir())) {
    setTimeout(() => {
      fs.rmSync(outDir, { recursive: true, force: true });
    }, 86400000);
  }
}

// --- CLI ---
const args = process.argv.slice(2);

if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
  console.log(`
  mdviewer - Markdown to styled HTML viewer

  Usage:
    mdviewer <file.md|folder> [--out <dir>]

  Examples:
    mdviewer README.md
    mdviewer ./docs
    mdviewer README.md --out ./export

  Output: opens in browser. HTML is saved to a temp directory by default.
  Use --out to specify a custom output directory.
  PDF: use the PDF button in the browser toolbar.
`);
  process.exit(0);
}

const target = path.resolve(args[0]);
const outIdx = args.indexOf("--out");
const outDirArg = outIdx !== -1 ? path.resolve(args[outIdx + 1]) : null;
const defaultOut = () => outDirArg || fs.mkdtempSync(path.join(os.tmpdir(), "mdviewer-"));

if (fs.statSync(target).isDirectory()) {
  const files = fs.readdirSync(target).filter((f) => f.endsWith(".md"));
  if (files.length === 0) {
    console.log("No .md files found.");
    process.exit(0);
  }
  const outDir = defaultOut();
  for (const f of files) {
    convert(path.join(target, f), outDir);
  }
} else {
  const outDir = defaultOut();
  convert(target, outDir);
}
