// core.mjs — Shared CSS, HTML template, and client-side JS for mdviewer
// Used by: Electron (main.cjs), Web (web/index.html), CLI (cli.mjs)

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read marked.js UMD for inline bundling
export function getMarkedJs() {
  return readFileSync(
    join(__dirname, "node_modules/marked/lib/marked.umd.js"),
    "utf-8"
  );
}

// === Preview CSS (themes + typography) ===
export const PREVIEW_CSS = `
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
    overflow: hidden;
  }
  article img {
    max-width: 100%;
    height: auto;
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

  a { color: inherit; }
  a:visited { color: inherit; }

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

  @media print {
    body { background: #fff !important; color: #222 !important; }
    h1, h2, h3 { color: #111 !important; border-color: #eee !important; }
    h4 { color: #555 !important; }
    p, li { color: #333 !important; }
    strong { color: #111 !important; }
    code { background: #f3f3f3 !important; color: #333 !important; }
    pre { background: #f7f7f7 !important; border-color: #e8e8e8 !important; }
    pre code { color: #333 !important; }
    blockquote { border-color: #ddd !important; color: #666 !important; }
    table { color: #333 !important; }
    th, td { border-color: #e0e0e0 !important; }
    th { background: #f7f7f7 !important; }
    tr:nth-child(even) td { background: #fafafa !important; }
    hr { border-color: #eee !important; }
    .toolbar, .toc, .copy-btn { display: none !important; }
    article { max-width: 100%; padding: 0; }
  }
  @page { margin: 1.5cm; size: A4; }
`;

// === Theme CSS ===
export const THEME_CSS = `
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
  body.space .copy-btn { background: rgba(255,255,255,0.08); color: #8b949e; }
  body.space .copy-btn:hover { background: rgba(255,255,255,0.12); }
  body.space mark.highlight { background: #2a4a2e; }

  /* Spring theme */
  body.spring { background: #fef8f9; color: #6b4d58; }
  body.spring h1, body.spring h2, body.spring h3 { color: #a8567a; border-color: #f5e0e8; }
  body.spring h4 { color: #b88898; }
  body.spring p, body.spring li { color: #6b4d58; }
  body.spring strong { color: #7a3058; }
  body.spring hr { border-color: #f5e0e8; }
  body.spring code { background: #fceef2; color: #8a5068; }
  body.spring pre { background: #fceef2; border-color: #f5e0e8; }
  body.spring pre code { color: #6b4d58; }
  body.spring blockquote { border-color: #f0c8d8; color: #b88898; }
  body.spring table { color: #6b4d58; }
  body.spring th, body.spring td { border-color: #f5e0e8; }
  body.spring th { background: #fceef2; }
  body.spring tr:nth-child(even) td { background: #fef8f9; }
  body.spring .copy-btn { background: rgba(168,86,122,0.05); color: #c8a0b0; }
  body.spring .copy-btn:hover { background: rgba(168,86,122,0.08); }
  body.spring mark.highlight { background: #f8d4e2; }

  /* Nugget theme */
  body.nugget { background: #f5f0e8; color: #3d3226; }
  body.nugget h1, body.nugget h2, body.nugget h3 { color: #5c4a3a; border-color: #e0d5c4; }
  body.nugget h4 { color: #8a7560; }
  body.nugget p, body.nugget li { color: #4a3d30; }
  body.nugget strong { color: #33261a; }
  body.nugget hr { border-color: #e0d5c4; }
  body.nugget code { background: #ebe4d8; color: #5c4a3a; }
  body.nugget pre { background: #ebe4d8; border-color: #d9cfbe; }
  body.nugget pre code { color: #4a3d30; }
  body.nugget blockquote { border-color: #c9b99a; color: #8a7560; }
  body.nugget table { color: #4a3d30; }
  body.nugget th, body.nugget td { border-color: #e0d5c4; }
  body.nugget th { background: #ebe4d8; }
  body.nugget tr:nth-child(even) td { background: #f5f0e8; }
  body.nugget .copy-btn { background: rgba(61,50,38,0.06); color: #a08e78; }
  body.nugget .copy-btn:hover { background: rgba(61,50,38,0.1); }
  body.nugget mark.highlight { background: #e0cc9a; }

  /* Forest theme */
  body.forest { background: #f0f4ee; color: #2d3a2d; }
  body.forest h1, body.forest h2, body.forest h3 { color: #3d5c3d; border-color: #d4e0d0; }
  body.forest h4 { color: #6a8a60; }
  body.forest p, body.forest li { color: #354535; }
  body.forest strong { color: #1a2e1a; }
  body.forest hr { border-color: #d4e0d0; }
  body.forest code { background: #e2ebe0; color: #3d5c3d; }
  body.forest pre { background: #e2ebe0; border-color: #cdd9c8; }
  body.forest pre code { color: #354535; }
  body.forest blockquote { border-color: #a8c4a0; color: #6a8a60; }
  body.forest table { color: #354535; }
  body.forest th, body.forest td { border-color: #d4e0d0; }
  body.forest th { background: #e2ebe0; }
  body.forest tr:nth-child(even) td { background: #f0f4ee; }
  body.forest .copy-btn { background: rgba(45,58,45,0.06); color: #88a880; }
  body.forest .copy-btn:hover { background: rgba(45,58,45,0.1); }
  body.forest mark.highlight { background: #c4e0a8; }

  /* Sky theme */
  body.sky { background: #f0f6fc; color: #2c3e50; }
  body.sky h1, body.sky h2, body.sky h3 { color: #2980b9; border-color: #d4e6f1; }
  body.sky h4 { color: #5dade2; }
  body.sky p, body.sky li { color: #34495e; }
  body.sky strong { color: #1a252f; }
  body.sky hr { border-color: #d4e6f1; }
  body.sky code { background: #ddeaf6; color: #2c3e50; }
  body.sky pre { background: #ddeaf6; border-color: #c5d9ed; }
  body.sky pre code { color: #34495e; }
  body.sky blockquote { border-color: #a9cce3; color: #5dade2; }
  body.sky table { color: #34495e; }
  body.sky th, body.sky td { border-color: #d4e6f1; }
  body.sky th { background: #ddeaf6; }
  body.sky tr:nth-child(even) td { background: #f0f6fc; }
  body.sky .copy-btn { background: rgba(41,128,185,0.06); color: #85c1e9; }
  body.sky .copy-btn:hover { background: rgba(41,128,185,0.1); }
  body.sky mark.highlight { background: #a9d4f5; }

  /* Wine theme */
  body.wine { background: #200a10; color: #d4b8c0; }
  body.wine h1, body.wine h2, body.wine h3 { color: #e05070; border-color: #3a1520; }
  body.wine h4 { color: #b06070; }
  body.wine p, body.wine li { color: #c8a0aa; }
  body.wine strong { color: #f0d0d8; }
  body.wine hr { border-color: #3a1520; }
  body.wine code { background: #2e0e18; color: #d4b8c0; }
  body.wine pre { background: #2e0e18; border-color: #3a1520; }
  body.wine pre code { color: #c8a0aa; }
  body.wine blockquote { border-color: #4a2030; color: #b06070; }
  body.wine table { color: #c8a0aa; }
  body.wine th, body.wine td { border-color: #3a1520; }
  body.wine th { background: #2e0e18; }
  body.wine tr:nth-child(even) td { background: #200a10; }
  body.wine .copy-btn { background: rgba(255,255,255,0.08); color: #b06070; }
  body.wine .copy-btn:hover { background: rgba(255,255,255,0.12); }
  body.wine mark.highlight { background: #5a1828; }

  /* Lemon theme */
  body.lemon { background: #fdfcf0; color: #3d3a2e; }
  body.lemon h1, body.lemon h2, body.lemon h3 { color: #8a7d2a; border-color: #e8e4c8; }
  body.lemon h4 { color: #a89e58; }
  body.lemon p, body.lemon li { color: #4a4636; }
  body.lemon strong { color: #2e2b1a; }
  body.lemon hr { border-color: #e8e4c8; }
  body.lemon code { background: #f2efd8; color: #5c5530; }
  body.lemon pre { background: #f2efd8; border-color: #e0dcbe; }
  body.lemon pre code { color: #4a4636; }
  body.lemon blockquote { border-color: #d4ce9a; color: #a89e58; }
  body.lemon table { color: #4a4636; }
  body.lemon th, body.lemon td { border-color: #e8e4c8; }
  body.lemon th { background: #f2efd8; }
  body.lemon tr:nth-child(even) td { background: #fdfcf0; }
  body.lemon .copy-btn { background: rgba(61,58,46,0.06); color: #b8b080; }
  body.lemon .copy-btn:hover { background: rgba(61,58,46,0.1); }
  body.lemon mark.highlight { background: #e8e0a0; }

  /* Grimace theme */
  body.grimace { background: #f5f0fa; color: #3a2d4a; }
  body.grimace h1, body.grimace h2, body.grimace h3 { color: #6b3fa0; border-color: #e0d4f0; }
  body.grimace h4 { color: #8a6ab8; }
  body.grimace p, body.grimace li { color: #4a3860; }
  body.grimace strong { color: #2e1a48; }
  body.grimace hr { border-color: #e0d4f0; }
  body.grimace code { background: #ece4f6; color: #5c3d8a; }
  body.grimace pre { background: #ece4f6; border-color: #ddd0ee; }
  body.grimace pre code { color: #4a3860; }
  body.grimace blockquote { border-color: #c4a8e0; color: #8a6ab8; }
  body.grimace table { color: #4a3860; }
  body.grimace th, body.grimace td { border-color: #e0d4f0; }
  body.grimace th { background: #ece4f6; }
  body.grimace tr:nth-child(even) td { background: #f5f0fa; }
  body.grimace .copy-btn { background: rgba(107,63,160,0.06); color: #a890c8; }
  body.grimace .copy-btn:hover { background: rgba(107,63,160,0.1); }
  body.grimace mark.highlight { background: #d4b8f0; }

  /* Mocha theme */
  body.mocha { background: #1c1410; color: #d4c4b0; }
  body.mocha h1, body.mocha h2, body.mocha h3 { color: #c8956a; border-color: #302018; }
  body.mocha h4 { color: #a08060; }
  body.mocha p, body.mocha li { color: #c0aa90; }
  body.mocha strong { color: #e8d8c4; }
  body.mocha hr { border-color: #302018; }
  body.mocha code { background: #281c14; color: #d4c4b0; }
  body.mocha pre { background: #281c14; border-color: #302018; }
  body.mocha pre code { color: #c0aa90; }
  body.mocha blockquote { border-color: #443020; color: #a08060; }
  body.mocha table { color: #c0aa90; }
  body.mocha th, body.mocha td { border-color: #302018; }
  body.mocha th { background: #281c14; }
  body.mocha tr:nth-child(even) td { background: #1c1410; }
  body.mocha .copy-btn { background: rgba(255,255,255,0.08); color: #a08060; }
  body.mocha .copy-btn:hover { background: rgba(255,255,255,0.12); }
  body.mocha mark.highlight { background: #4a3018; }

  /* Sunset theme */
  body.sunset { background: #1a1018; color: #e0c8b8; }
  body.sunset h1, body.sunset h2, body.sunset h3 { color: #e88040; border-color: #302020; }
  body.sunset h4 { color: #c08060; }
  body.sunset p, body.sunset li { color: #d0b0a0; }
  body.sunset strong { color: #f0e0d0; }
  body.sunset hr { border-color: #302020; }
  body.sunset code { background: #281810; color: #e0c8b8; }
  body.sunset pre { background: #281810; border-color: #302020; }
  body.sunset pre code { color: #d0b0a0; }
  body.sunset blockquote { border-color: #482818; color: #c08060; }
  body.sunset table { color: #d0b0a0; }
  body.sunset th, body.sunset td { border-color: #302020; }
  body.sunset th { background: #281810; }
  body.sunset tr:nth-child(even) td { background: #1a1018; }
  body.sunset .copy-btn { background: rgba(255,255,255,0.08); color: #c08060; }
  body.sunset .copy-btn:hover { background: rgba(255,255,255,0.12); }
  body.sunset mark.highlight { background: #583010; }
`;

// === Editor UI CSS ===
export const EDITOR_CSS = `
    .pane {
      width: 50%;
      height: 100%;
      overflow-y: auto;
    }

    .editor-pane {
      display: flex;
      flex-direction: column;
      background: #1e1e1e !important;
    }

    .editor-header {
      display: flex;
      align-items: center;
      height: 40px;
      padding: 0 16px;
      background: #252526 !important;
      border-bottom: 1px solid #333;
      flex-shrink: 0;
    }

    .editor-header .file-icon {
      width: 16px;
      height: 16px;
      margin-right: 8px;
      fill: #519aba;
    }

    .editor-header .file-name {
      font-size: 13px;
      color: #ccc;
      font-weight: 400;
    }

    .editor-pane textarea {
      flex: 1;
      min-height: 0;
      width: 100%;
      border: none;
      outline: none;
      resize: none;
      background: #1e1e1e !important;
      color: #d4d4d4 !important;
      font-family: 'SF Mono', 'Consolas', 'Liberation Mono', monospace;
      font-size: 14px;
      line-height: 1.5;
      padding: 16px 20px;
      tab-size: 2;
      caret-color: #aeafad;
    }

    .editor-pane textarea::selection {
      background: #264f78;
    }

    .preview-pane {
      background: #fff;
      display: flex;
      flex-direction: column;
    }

    .preview-header {
      display: flex;
      align-items: center;
      height: 40px;
      padding: 0 16px;
      background: #f8f8f8;
      border-bottom: 1px solid #e5e5e5;
      flex-shrink: 0;
      overflow: visible;
      position: relative;
      z-index: 100;
    }

    .preview-header .label {
      font-size: 13px;
      color: #888;
      font-weight: 500;
    }

    .preview-content {
      flex: 1;
      overflow-y: auto;
    }

    .divider {
      width: 1px;
      background: #333;
      cursor: col-resize;
      position: relative;
      flex-shrink: 0;
    }
    .divider::after {
      content: '';
      position: absolute;
      top: 0;
      left: -3px;
      width: 7px;
      height: 100%;
    }
    .divider:hover, .divider.dragging {
      background: #007aff;
      width: 2px;
    }

    .preview-content article {
      max-width: none;
      padding: 32px 32px 96px;
    }

    .preview-content .toolbar,
    .preview-content .toc { display: none; }

    .header-controls {
      display: flex;
      align-items: center;
      gap: 2px;
      margin-left: auto;
    }

    .ctrl-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-family: inherit;
      display: flex;
      align-items: center;
      gap: 4px;
      transition: background 0.15s;
    }

    .editor-header .ctrl-btn { color: #999; }
    .editor-header .ctrl-btn:hover { background: rgba(255,255,255,0.1); color: #ccc; }
    .preview-header .ctrl-btn { color: #888; }
    .preview-header .ctrl-btn:hover { background: rgba(0,0,0,0.06); color: #555; }

    .ctrl-btn svg { width: 14px; height: 14px; }

    .preview-header .ctrl-sep {
      width: 1px;
      height: 16px;
      background: #ddd;
      margin: 0 4px;
    }

    .search-bar {
      display: none;
      padding: 8px 16px;
      background: #252526;
      border-bottom: 1px solid #333;
      gap: 8px;
      align-items: center;
      flex-shrink: 0;
    }

    .search-bar.visible { display: flex; }

    .search-bar input {
      background: #3c3c3c;
      border: 1px solid #555;
      border-radius: 4px;
      color: #d4d4d4;
      font-size: 13px;
      font-family: inherit;
      padding: 4px 8px;
      outline: none;
      width: 200px;
    }

    .search-bar input:focus { border-color: #007aff; }

    .search-bar .search-label { font-size: 12px; color: #888; flex-shrink: 0; }

    .search-bar button {
      background: #3c3c3c;
      border: 1px solid #555;
      border-radius: 4px;
      color: #ccc;
      font-size: 12px;
      padding: 4px 10px;
      cursor: pointer;
      font-family: inherit;
    }

    .search-bar button:hover { background: #4c4c4c; }

    .search-bar .close-search {
      background: none;
      border: none;
      color: #888;
      font-size: 16px;
      cursor: pointer;
      padding: 2px 6px;
      margin-left: auto;
    }

    .search-bar .close-search:hover { color: #ccc; }

    .search-match-info { font-size: 11px; color: #888; min-width: 60px; }

    .theme-menu {
      display: none;
      position: fixed;
      background: #fff;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.12);
      padding: 6px;
      z-index: 9999;
      grid-template-columns: repeat(3, 1fr);
      gap: 4px;
      width: 240px;
    }

    .theme-menu.visible { display: grid; }

    .theme-swatch {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 5px 8px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 11px;
      font-family: inherit;
      background: transparent;
      color: #555;
      transition: background 0.1s;
    }

    .theme-swatch:hover { background: #f0f0f0; }
    .theme-swatch.active { background: #e8e8e8; font-weight: 600; }

    .theme-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
      border: 1px solid rgba(0,0,0,0.1);
    }

    mark.highlight {
      background: #fff3aa;
      color: inherit;
      border-radius: 2px;
      padding: 0 1px;
    }

    mark.highlight-current {
      background: #ff9632;
      color: #fff;
    }
`;

// === Themes data ===
export const THEMES = [
  { name: 'Light', cls: '', bg: '#fff' },
  { name: 'Dark', cls: 'dark', bg: '#1a1a1a' },
  { name: 'Space', cls: 'space', bg: '#0d1117' },
  { name: 'Spring', cls: 'spring', bg: '#fef8f9' },
  { name: 'Nugget', cls: 'nugget', bg: '#f5f0e8' },
  { name: 'Forest', cls: 'forest', bg: '#f0f4ee' },
  { name: 'Sky', cls: 'sky', bg: '#f0f6fc' },
  { name: 'Wine', cls: 'wine', bg: '#200a10' },
  { name: 'Lemon', cls: 'lemon', bg: '#fdfcf0' },
  { name: 'Grimace', cls: 'grimace', bg: '#f5f0fa' },
  { name: 'Mocha', cls: 'mocha', bg: '#1c1410' },
  { name: 'Sunset', cls: 'sunset', bg: '#1a1018' },
];

// === HTML template builder ===
// options.markedJs: inline marked.js source (for bundling)
// options.markedSrc: CDN URL for marked.js (for web)
// options.onSave: JS string for save callback (e.g., "window.mdviewer.saveFile(editor.value)")
// options.onPdf: JS string for PDF callback
export function buildEditorHtml(escapedMd, title, options = {}) {
  const markedScript = options.markedJs
    ? `<script>${options.markedJs}</script>`
    : `<script src="${options.markedSrc || 'https://cdn.jsdelivr.net/npm/marked/marked.min.js'}"></script>`;

  const saveCall = options.onSave || '';
  const pdfCall = options.onPdf || 'window.print()';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  ${markedScript}
  <style>
    @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { height: 100%; overflow: hidden; }
    body {
      font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
      display: flex;
      background: #1e1e1e;
    }
    ${EDITOR_CSS}
    ${PREVIEW_CSS}
    ${THEME_CSS}
  </style>
</head>
<body>
  <div class="pane editor-pane">
    <div class="editor-header">
      <svg class="file-icon" viewBox="0 0 24 24"><path d="M20.56 18H3.44C2.65 18 2 17.37 2 16.59V7.41C2 6.63 2.65 6 3.44 6h17.12C21.35 6 22 6.63 22 7.41v9.18c0 .78-.65 1.41-1.44 1.41zM11.5 9.5L7.5 12l4 2.5v-5z" fill="#519aba"/></svg>
      <span class="file-name">${title}.md</span>
    </div>
    <div class="search-bar" id="searchBar">
      <span class="search-label">Find</span>
      <input type="text" id="searchInput" placeholder="Search...">
      <span class="search-match-info" id="matchInfo"></span>
      <button onclick="findPrev()" title="Previous">&lsaquo;</button>
      <button onclick="findNext()" title="Next">&rsaquo;</button>
      <span class="search-label" style="margin-left:8px">Replace</span>
      <input type="text" id="replaceInput" placeholder="Replace with...">
      <button onclick="replaceCurrent()">Replace</button>
      <button onclick="replaceAll()">All</button>
      <button class="close-search" onclick="toggleSearch()">&times;</button>
    </div>
    <textarea id="editor" spellcheck="false">${escapedMd}</textarea>
  </div>
  <div class="divider" id="divider"></div>
  <div class="pane preview-pane">
    <div class="preview-header">
      <span class="label">Preview</span>
      <div class="header-controls">
        <button class="ctrl-btn hold-btn" data-action="adjustFontSize" data-delta="-1" title="Decrease font size">A\u2212</button>
        <button class="ctrl-btn hold-btn" data-action="adjustFontSize" data-delta="1" title="Increase font size">A+</button>
        <div class="ctrl-sep"></div>
        <button class="ctrl-btn hold-btn" data-action="adjustLineHeight" data-delta="-0.1" title="Decrease line height">
          <svg viewBox="0 0 14 14" fill="currentColor"><rect x="1" y="2" width="12" height="1.5"/><rect x="1" y="6.5" width="12" height="1.5"/><rect x="1" y="11" width="12" height="1.5"/></svg>
        </button>
        <button class="ctrl-btn hold-btn" data-action="adjustLineHeight" data-delta="0.1" title="Increase line height">
          <svg viewBox="0 0 14 14" fill="currentColor"><rect x="1" y="1" width="12" height="1.5"/><rect x="1" y="6.25" width="12" height="1.5"/><rect x="1" y="11.5" width="12" height="1.5"/></svg>
        </button>
        <div class="ctrl-sep"></div>
        <button class="ctrl-btn hold-btn" data-action="adjustWidth" data-delta="-40" title="Narrower">\u25BD</button>
        <button class="ctrl-btn" id="widthLabel" style="pointer-events:none;color:#aaa;font-size:11px">100%</button>
        <button class="ctrl-btn hold-btn" data-action="adjustWidth" data-delta="40" title="Wider">\u25B3</button>
        <div class="ctrl-sep"></div>
        <button class="ctrl-btn" id="themeBtn" onclick="toggleThemeMenu()" title="Theme">
          <svg viewBox="0 0 24 24" fill="currentColor" style="width:14px;height:14px"><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-1 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>
        </button>
        <div class="ctrl-sep"></div>
        <button class="ctrl-btn" onclick="downloadPdf()" title="Save as PDF">PDF</button>
        <div class="ctrl-sep"></div>
        <button class="ctrl-btn" onclick="toggleSearch()" title="Find & Replace">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        </button>
      </div>
    </div>
    <div class="preview-content" id="preview">
      <article id="content"></article>
    </div>
  </div>

  <div class="theme-menu" id="themeMenu"></div>

  <script>
    var editor = document.getElementById('editor');
    var content = document.getElementById('content');
    var divider = document.getElementById('divider');
    var editorPane = document.querySelector('.editor-pane');
    var previewPane = document.querySelector('.preview-pane');
    var previewScroll = document.getElementById('preview');

    function renderPreview() {
      content.innerHTML = marked.parse(editor.value);
      content.querySelectorAll('pre').forEach(function(pre) {
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
    }

    // Auto-save
    var saveTimer = null;
    function autoSave() {
      ${saveCall ? `clearTimeout(saveTimer);
      saveTimer = setTimeout(function() { ${saveCall} }, 300);` : ''}
    }

    editor.addEventListener('input', function() {
      renderPreview();
      autoSave();
    });
    renderPreview();

    // Draggable divider
    var isDragging = false;
    divider.addEventListener('mousedown', function(e) {
      isDragging = true;
      divider.classList.add('dragging');
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      e.preventDefault();
    });
    document.addEventListener('mousemove', function(e) {
      if (!isDragging) return;
      var ratio = e.clientX / window.innerWidth * 100;
      ratio = Math.max(20, Math.min(80, ratio));
      editorPane.style.width = ratio + '%';
      previewPane.style.width = (100 - ratio) + '%';
    });
    document.addEventListener('mouseup', function() {
      if (isDragging) {
        isDragging = false;
        divider.classList.remove('dragging');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    });

    // Sync scroll
    editor.addEventListener('scroll', function() {
      var ratio = editor.scrollTop / (editor.scrollHeight - editor.clientHeight);
      previewScroll.scrollTop = ratio * (previewScroll.scrollHeight - previewScroll.clientHeight);
    });

    // Tab key
    editor.addEventListener('keydown', function(e) {
      if (e.key === 'Tab') {
        e.preventDefault();
        var start = this.selectionStart;
        var end = this.selectionEnd;
        this.value = this.value.substring(0, start) + '  ' + this.value.substring(end);
        this.selectionStart = this.selectionEnd = start + 2;
        renderPreview();
      }
    });

    // === Preview controls ===
    var currentFontSize = 15.5;
    var currentLineHeight = 1.8;
    var currentMaxWidth = 100;

    function adjustFontSize(delta) {
      currentFontSize = Math.max(8, Math.min(100, currentFontSize + delta));
      document.getElementById('preview').style.zoom = currentFontSize / 15.5;
    }

    function adjustLineHeight(delta) {
      currentLineHeight = Math.max(1.2, Math.min(3, currentLineHeight + delta));
      content.querySelectorAll('p, li, td, th, blockquote, pre, code, h1, h2, h3, h4').forEach(function(el) {
        el.style.lineHeight = currentLineHeight;
      });
    }

    function adjustWidth(delta) {
      currentMaxWidth = Math.max(40, Math.min(100, currentMaxWidth + (delta / 40 * 10)));
      content.style.maxWidth = currentMaxWidth + '%';
      content.style.margin = '0 auto';
      document.getElementById('widthLabel').textContent = Math.round(currentMaxWidth) + '%';
    }

    function downloadPdf() {
      ${pdfCall}
    }

    // === Search & Replace ===
    var searchMatches = [];
    var currentMatch = -1;

    function toggleSearch() {
      var bar = document.getElementById('searchBar');
      var scrollPos = editor.scrollTop;
      bar.classList.toggle('visible');
      if (bar.classList.contains('visible')) {
        editor.scrollTop = scrollPos;
        document.getElementById('searchInput').focus();
      } else {
        searchMatches = [];
        currentMatch = -1;
        document.getElementById('matchInfo').textContent = '';
        document.getElementById('searchInput').value = '';
        document.getElementById('replaceInput').value = '';
        renderPreview();
        editor.scrollTop = scrollPos;
      }
    }

    function findMatches() {
      var query = document.getElementById('searchInput').value;
      searchMatches = [];
      currentMatch = -1;
      if (!query) {
        document.getElementById('matchInfo').textContent = '';
        renderPreview();
        return;
      }
      var text = editor.value;
      var lower = text.toLowerCase();
      var q = query.toLowerCase();
      var idx = 0;
      while ((idx = lower.indexOf(q, idx)) !== -1) {
        searchMatches.push(idx);
        idx += q.length;
      }
      document.getElementById('matchInfo').textContent = searchMatches.length + ' found';
      if (searchMatches.length > 0) {
        currentMatch = 0;
      }
      highlightInPreview();
    }

    function selectMatch() {
      if (currentMatch < 0 || currentMatch >= searchMatches.length) return;
      var query = document.getElementById('searchInput').value;
      var pos = searchMatches[currentMatch];
      document.getElementById('matchInfo').textContent = (currentMatch + 1) + '/' + searchMatches.length;
      highlightInPreview();
      editor.readOnly = true;
      editor.focus();
      editor.setSelectionRange(pos, pos + query.length);
      var linesBefore = editor.value.substring(0, pos).split('\\n').length;
      var lineH = parseFloat(getComputedStyle(editor).lineHeight);
      editor.scrollTop = (linesBefore - 3) * lineH;
      setTimeout(function() {
        editor.readOnly = false;
        document.getElementById('searchInput').focus();
      }, 50);
    }

    function highlightInPreview() {
      var query = document.getElementById('searchInput').value;
      content.innerHTML = marked.parse(editor.value);
      if (!query) return;
      var walk = document.createTreeWalker(content, NodeFilter.SHOW_TEXT);
      var nodes = [];
      while (walk.nextNode()) nodes.push(walk.currentNode);
      var lowerQ = query.toLowerCase();
      var matchIdx = 0;
      nodes.forEach(function(node) {
        if (node.parentNode.tagName === 'SCRIPT' || node.parentNode.tagName === 'STYLE') return;
        var text = node.textContent;
        var lowerText = text.toLowerCase();
        var parts = [];
        var lastIdx = 0;
        var i;
        while ((i = lowerText.indexOf(lowerQ, lastIdx)) !== -1) {
          if (i > lastIdx) parts.push(document.createTextNode(text.substring(lastIdx, i)));
          var mark = document.createElement('mark');
          mark.className = matchIdx === currentMatch ? 'highlight highlight-current' : 'highlight';
          mark.textContent = text.substring(i, i + query.length);
          parts.push(mark);
          matchIdx++;
          lastIdx = i + query.length;
        }
        if (parts.length > 0) {
          if (lastIdx < text.length) parts.push(document.createTextNode(text.substring(lastIdx)));
          var span = document.createElement('span');
          parts.forEach(function(p) { span.appendChild(p); });
          node.parentNode.replaceChild(span, node);
        }
      });
      var current = content.querySelector('.highlight-current');
      if (current) current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function findNext() {
      if (searchMatches.length === 0) { findMatches(); return; }
      currentMatch = (currentMatch + 1) % searchMatches.length;
      selectMatch();
    }

    function findPrev() {
      if (searchMatches.length === 0) { findMatches(); return; }
      currentMatch = (currentMatch - 1 + searchMatches.length) % searchMatches.length;
      selectMatch();
    }

    function replaceCurrent() {
      if (currentMatch < 0 || currentMatch >= searchMatches.length) return;
      var query = document.getElementById('searchInput').value;
      var replace = document.getElementById('replaceInput').value;
      var pos = searchMatches[currentMatch];
      editor.value = editor.value.substring(0, pos) + replace + editor.value.substring(pos + query.length);
      renderPreview();
      autoSave();
      setTimeout(findMatches, 500);
    }

    function replaceAll() {
      var query = document.getElementById('searchInput').value;
      var replace = document.getElementById('replaceInput').value;
      if (!query) return;
      var escaped = query.replace(/[-\\/\\\\^$*+?.()|[\\]]/g, '\\\\$&');
      var regex = new RegExp(escaped, 'gi');
      var count = (editor.value.match(regex) || []).length;
      editor.value = editor.value.replace(regex, replace);
      renderPreview();
      autoSave();
      searchMatches = [];
      currentMatch = -1;
      document.getElementById('matchInfo').textContent = count + ' replaced';
    }

    document.getElementById('searchInput').addEventListener('input', findMatches);
    document.getElementById('searchInput').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') { e.preventDefault(); e.shiftKey ? findPrev() : findNext(); }
      if (e.key === 'Escape') toggleSearch();
    });

    // Hold-to-repeat buttons
    var holdTimer = null;
    var holdInterval = null;
    var actions = { adjustFontSize: adjustFontSize, adjustLineHeight: adjustLineHeight, adjustWidth: adjustWidth };
    document.querySelectorAll('.hold-btn').forEach(function(btn) {
      var fn = actions[btn.dataset.action];
      var delta = parseFloat(btn.dataset.delta);
      function fire() { fn(delta); }
      btn.addEventListener('mousedown', function(e) {
        e.preventDefault();
        fire();
        holdTimer = setTimeout(function() {
          holdInterval = setInterval(fire, 80);
        }, 400);
      });
      btn.addEventListener('mouseup', stopHold);
      btn.addEventListener('mouseleave', stopHold);
    });
    function stopHold() {
      clearTimeout(holdTimer);
      clearInterval(holdInterval);
    }

    // Theme menu
    var themes = ${JSON.stringify(THEMES)};
    var currentTheme = '';
    var themeMenuEl = document.getElementById('themeMenu');
    themes.forEach(function(t) {
      var btn = document.createElement('button');
      btn.className = 'theme-swatch' + (t.cls === currentTheme ? ' active' : '');
      btn.innerHTML = '<span class="theme-dot" style="background:' + t.bg + '"></span>' + t.name;
      btn.addEventListener('click', function() {
        currentTheme = t.cls;
        document.body.className = t.cls || '';
        themeMenuEl.querySelectorAll('.theme-swatch').forEach(function(s) { s.classList.remove('active'); });
        btn.classList.add('active');
        document.querySelector('.preview-pane').style.background = t.bg;
        document.getElementById('preview').style.background = t.bg;
        themeMenuEl.classList.remove('visible');
      });
      themeMenuEl.appendChild(btn);
    });

    function toggleThemeMenu() {
      if (themeMenuEl.classList.contains('visible')) {
        themeMenuEl.classList.remove('visible');
        return;
      }
      var btn = document.getElementById('themeBtn');
      var rect = btn.getBoundingClientRect();
      themeMenuEl.style.top = (rect.bottom + 4) + 'px';
      themeMenuEl.style.right = (window.innerWidth - rect.right) + 'px';
      themeMenuEl.classList.add('visible');
    }

    document.addEventListener('click', function(e) {
      if (!e.target.closest('.theme-menu') && !e.target.closest('#themeBtn')) {
        themeMenuEl.classList.remove('visible');
      }
    });

    // Cmd+F shortcut
    document.addEventListener('keydown', function(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        toggleSearch();
      }
    });
  </script>
</body>
</html>`;
}
