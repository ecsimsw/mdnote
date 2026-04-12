#!/usr/bin/env node

import fs from "fs";
import path from "path";
import os from "os";
import { execSync } from "child_process";
import { marked } from "marked";

export const CSS = `
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
  body.spring .toc a:hover { color: #a8567a; }
  body.spring .toc a.active { color: #7a3058; }
  body.spring .toolbar { background: rgba(254,248,249,0.85); box-shadow: 0 1px 4px rgba(168,86,122,0.06), 0 0 0 0.5px rgba(168,86,122,0.04); }
  body.spring .toolbar button { color: #c8a0b0; }
  body.spring .toolbar button:hover { background: rgba(168,86,122,0.05); }
  body.spring .toolbar .divider { background: rgba(168,86,122,0.06); }
  body.spring .toolbar .search-input { background: rgba(255,255,255,0.6); border-color: #f5e0e8; color: #6b4d58; }
  body.spring .copy-btn { background: rgba(168,86,122,0.05); color: #c8a0b0; }
  body.spring .copy-btn:hover { background: rgba(168,86,122,0.08); }
  body.spring mark.highlight { background: #f8d4e2; }
  body.spring .toolbar button.active-theme { background: rgba(139,58,98,0.1); color: #8b3a62; }
  body.spring .replace-row .replace-btn { border-color: #f0d4de; color: #b08898; }

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
  body.nugget .toc a:hover { color: #5c4a3a; }
  body.nugget .toc a.active { color: #33261a; }
  body.nugget .toolbar { background: rgba(245,240,232,0.85); box-shadow: 0 1px 4px rgba(61,50,38,0.08), 0 0 0 0.5px rgba(61,50,38,0.06); }
  body.nugget .toolbar button { color: #a08e78; }
  body.nugget .toolbar button:hover { background: rgba(61,50,38,0.06); }
  body.nugget .toolbar .divider { background: rgba(61,50,38,0.08); }
  body.nugget .toolbar .search-input { background: rgba(255,255,255,0.5); border-color: #e0d5c4; color: #3d3226; }
  body.nugget .copy-btn { background: rgba(61,50,38,0.06); color: #a08e78; }
  body.nugget .copy-btn:hover { background: rgba(61,50,38,0.1); }
  body.nugget mark.highlight { background: #e0cc9a; }
  body.nugget .toolbar button.active-theme { background: rgba(61,50,38,0.1); color: #5c4a3a; }
  body.nugget .replace-row .replace-btn { border-color: #e0d5c4; color: #a08e78; }

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
  body.forest .toc a:hover { color: #3d5c3d; }
  body.forest .toc a.active { color: #1a2e1a; }
  body.forest .toolbar { background: rgba(240,244,238,0.85); box-shadow: 0 1px 4px rgba(45,58,45,0.08), 0 0 0 0.5px rgba(45,58,45,0.06); }
  body.forest .toolbar button { color: #88a880; }
  body.forest .toolbar button:hover { background: rgba(45,58,45,0.06); }
  body.forest .toolbar .divider { background: rgba(45,58,45,0.08); }
  body.forest .toolbar .search-input { background: rgba(255,255,255,0.5); border-color: #d4e0d0; color: #2d3a2d; }
  body.forest .copy-btn { background: rgba(45,58,45,0.06); color: #88a880; }
  body.forest .copy-btn:hover { background: rgba(45,58,45,0.1); }
  body.forest mark.highlight { background: #c4e0a8; }
  body.forest .toolbar button.active-theme { background: rgba(45,58,45,0.1); color: #3d5c3d; }
  body.forest .replace-row .replace-btn { border-color: #d4e0d0; color: #88a880; }

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
  body.sky .toc a:hover { color: #2980b9; }
  body.sky .toc a.active { color: #1a5276; }
  body.sky .toolbar { background: rgba(240,246,252,0.85); box-shadow: 0 1px 4px rgba(41,128,185,0.08), 0 0 0 0.5px rgba(41,128,185,0.06); }
  body.sky .toolbar button { color: #85c1e9; }
  body.sky .toolbar button:hover { background: rgba(41,128,185,0.06); }
  body.sky .toolbar .divider { background: rgba(41,128,185,0.08); }
  body.sky .toolbar .search-input { background: rgba(255,255,255,0.5); border-color: #d4e6f1; color: #2c3e50; }
  body.sky .copy-btn { background: rgba(41,128,185,0.06); color: #85c1e9; }
  body.sky .copy-btn:hover { background: rgba(41,128,185,0.1); }
  body.sky mark.highlight { background: #a9d4f5; }
  body.sky .toolbar button.active-theme { background: rgba(41,128,185,0.1); color: #2980b9; }
  body.sky .replace-row .replace-btn { border-color: #d4e6f1; color: #85c1e9; }

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
  body.wine .toc a:hover { color: #d4b8c0; }
  body.wine .toc a.active { color: #e05070; }
  body.wine .toolbar { background: rgba(46,14,24,0.85); box-shadow: 0 1px 4px rgba(0,0,0,0.4), 0 0 0 0.5px rgba(255,255,255,0.04); }
  body.wine .toolbar button { color: #b06070; }
  body.wine .toolbar button:hover { background: rgba(255,255,255,0.06); }
  body.wine .toolbar .divider { background: rgba(255,255,255,0.06); }
  body.wine .toolbar .search-input { background: rgba(0,0,0,0.3); border-color: #4a2030; color: #d4b8c0; }
  body.wine .copy-btn { background: rgba(255,255,255,0.08); color: #b06070; }
  body.wine .copy-btn:hover { background: rgba(255,255,255,0.12); }
  body.wine mark.highlight { background: #5a1828; }
  body.wine .toolbar button.active-theme { background: rgba(224,80,112,0.15); color: #e05070; }
  body.wine .replace-row .replace-btn { border-color: #4a2030; color: #b06070; }

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
  body.lemon .toc a:hover { color: #8a7d2a; }
  body.lemon .toc a.active { color: #5c5530; }
  body.lemon .toolbar { background: rgba(253,252,240,0.85); box-shadow: 0 1px 4px rgba(61,58,46,0.08), 0 0 0 0.5px rgba(61,58,46,0.06); }
  body.lemon .toolbar button { color: #b8b080; }
  body.lemon .toolbar button:hover { background: rgba(61,58,46,0.06); }
  body.lemon .toolbar .divider { background: rgba(61,58,46,0.08); }
  body.lemon .toolbar .search-input { background: rgba(255,255,255,0.5); border-color: #e8e4c8; color: #3d3a2e; }
  body.lemon .copy-btn { background: rgba(61,58,46,0.06); color: #b8b080; }
  body.lemon .copy-btn:hover { background: rgba(61,58,46,0.1); }
  body.lemon mark.highlight { background: #e8e0a0; }
  body.lemon .toolbar button.active-theme { background: rgba(61,58,46,0.1); color: #8a7d2a; }
  body.lemon .replace-row .replace-btn { border-color: #e8e4c8; color: #b8b080; }

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
  body.grimace .toc a:hover { color: #6b3fa0; }
  body.grimace .toc a.active { color: #2e1a48; }
  body.grimace .toolbar { background: rgba(245,240,250,0.85); box-shadow: 0 1px 4px rgba(107,63,160,0.08), 0 0 0 0.5px rgba(107,63,160,0.06); }
  body.grimace .toolbar button { color: #a890c8; }
  body.grimace .toolbar button:hover { background: rgba(107,63,160,0.06); }
  body.grimace .toolbar .divider { background: rgba(107,63,160,0.08); }
  body.grimace .toolbar .search-input { background: rgba(255,255,255,0.5); border-color: #e0d4f0; color: #3a2d4a; }
  body.grimace .copy-btn { background: rgba(107,63,160,0.06); color: #a890c8; }
  body.grimace .copy-btn:hover { background: rgba(107,63,160,0.1); }
  body.grimace mark.highlight { background: #d4b8f0; }
  body.grimace .toolbar button.active-theme { background: rgba(107,63,160,0.1); color: #6b3fa0; }
  body.grimace .replace-row .replace-btn { border-color: #e0d4f0; color: #a890c8; }

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
  body.mocha .toc a:hover { color: #d4c4b0; }
  body.mocha .toc a.active { color: #c8956a; }
  body.mocha .toolbar { background: rgba(40,28,20,0.85); box-shadow: 0 1px 4px rgba(0,0,0,0.4), 0 0 0 0.5px rgba(255,255,255,0.04); }
  body.mocha .toolbar button { color: #a08060; }
  body.mocha .toolbar button:hover { background: rgba(255,255,255,0.06); }
  body.mocha .toolbar .divider { background: rgba(255,255,255,0.06); }
  body.mocha .toolbar .search-input { background: rgba(0,0,0,0.3); border-color: #443020; color: #d4c4b0; }
  body.mocha .copy-btn { background: rgba(255,255,255,0.08); color: #a08060; }
  body.mocha .copy-btn:hover { background: rgba(255,255,255,0.12); }
  body.mocha mark.highlight { background: #4a3018; }
  body.mocha .toolbar button.active-theme { background: rgba(200,149,106,0.15); color: #c8956a; }
  body.mocha .replace-row .replace-btn { border-color: #443020; color: #a08060; }

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
  body.sunset .toc a:hover { color: #e0c8b8; }
  body.sunset .toc a.active { color: #e88040; }
  body.sunset .toolbar { background: rgba(40,24,16,0.85); box-shadow: 0 1px 4px rgba(0,0,0,0.4), 0 0 0 0.5px rgba(255,255,255,0.04); }
  body.sunset .toolbar button { color: #c08060; }
  body.sunset .toolbar button:hover { background: rgba(255,255,255,0.06); }
  body.sunset .toolbar .divider { background: rgba(255,255,255,0.06); }
  body.sunset .toolbar .search-input { background: rgba(0,0,0,0.3); border-color: #482818; color: #e0c8b8; }
  body.sunset .copy-btn { background: rgba(255,255,255,0.08); color: #c08060; }
  body.sunset .copy-btn:hover { background: rgba(255,255,255,0.12); }
  body.sunset mark.highlight { background: #583010; }
  body.sunset .toolbar button.active-theme { background: rgba(232,128,64,0.15); color: #e88040; }
  body.sunset .replace-row .replace-btn { border-color: #482818; color: #c08060; }

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
    flex: 1;
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

export function buildHtml(mdContent, title) {
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
    <div class="row-label">Margin</div>
    <div class="row">
      <button onclick="adjustMargin(-12)">\u2212</button>
      <span class="val" id="marginLabel">72</span>
      <button onclick="adjustMargin(12)">+</button>
    </div>
    <div class="divider"></div>
    <div class="row-label">Download</div>
    <div class="row">
      <button onclick="downloadPdf()">PDF</button>
      <button onclick="downloadTxt()">TXT</button>
    </div>
    <div class="divider"></div>
    <div class="row-label">Edit</div>
    <div class="row">
      <button onclick="toggleEdit()" id="editBtn">OFF</button>
    </div>
    <div class="divider"></div>
    <div class="row-label">Theme</div>
    <div class="row">
      <button onclick="setTheme('light')" id="themeLight" class="active-theme">Milk</button>
      <button onclick="setTheme('dark')" id="themeDark">Night</button>
      <button onclick="setTheme('space')" id="themeSpace">Space</button>
    </div>
    <div class="row">
      <button onclick="setTheme('spring')" id="themeSpring">Spring</button>
      <button onclick="setTheme('nugget')" id="themeNugget">Nugget</button>
      <button onclick="setTheme('forest')" id="themeForest">Forest</button>
    </div>
    <div class="row">
      <button onclick="setTheme('sky')" id="themeSky">Ocean</button>
      <button onclick="setTheme('grimace')" id="themeGrimace">Grape</button>
      <button onclick="setTheme('lemon')" id="themeLemon">Lemon</button>
    </div>
    <div class="row">
      <button onclick="setTheme('wine')" id="themeWine">Wine</button>
      <button onclick="setTheme('sunset')" id="themeSunset">Sunset</button>
      <button onclick="setTheme('mocha')" id="themeMocha">Mocha</button>
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

    let spacing = 100;
    function adjustMargin(d) {
      spacing = Math.max(50, Math.min(200, spacing + d));
      var r = spacing / 100;
      document.documentElement.style.lineHeight = (1.8 * r).toFixed(2);
      content.style.paddingTop = Math.round(72 * r) + 'px';
      content.style.paddingBottom = Math.round(96 * r) + 'px';
      content.querySelectorAll('h1').forEach(function(e) { e.style.margin = Math.round(52*r)+'px 0 '+Math.round(16*r)+'px'; });
      content.querySelectorAll('h2').forEach(function(e) { e.style.margin = Math.round(44*r)+'px 0 '+Math.round(12*r)+'px'; });
      content.querySelectorAll('h3').forEach(function(e) { e.style.margin = Math.round(36*r)+'px 0 '+Math.round(8*r)+'px'; });
      content.querySelectorAll('p').forEach(function(e) { e.style.marginBottom = Math.round(4*r)+'px'; });
      content.querySelectorAll('pre,blockquote').forEach(function(e) { e.style.margin = Math.round(24*r)+'px 0'; });
      content.querySelectorAll('ul,ol').forEach(function(e) { e.style.margin = Math.round(14*r)+'px 0'; });
      content.querySelectorAll('li').forEach(function(e) { e.style.marginBottom = Math.round(6*r)+'px'; });
      document.getElementById('marginLabel').textContent = spacing + '%';
    }

    var editing = false;
    function toggleEdit() {
      editing = !editing;
      content.contentEditable = editing;
      var btn = document.getElementById('editBtn');
      btn.textContent = editing ? 'ON' : 'OFF';
      if (editing) {
        btn.classList.add('active-theme');
        content.style.outline = 'none';
        content.focus();
      } else {
        btn.classList.remove('active-theme');
      }
    }

    updatePositions();

    // Theme
    function setTheme(t) {
      document.body.className = t === 'light' ? '' : t;
      document.querySelectorAll('#themeLight,#themeDark,#themeSpace,#themeSpring,#themeNugget,#themeForest,#themeSky,#themeWine,#themeLemon,#themeGrimace,#themeMocha,#themeSunset').forEach(function(b) {
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

}

// 하루 이상 지난 mdviewer 임시 디렉토리 정리
function cleanOldTempDirs() {
  const tmpBase = os.tmpdir();
  const now = Date.now();
  const oneDay = 86400000;
  try {
    for (const name of fs.readdirSync(tmpBase)) {
      if (!name.startsWith("mdviewer-")) continue;
      const dirPath = path.join(tmpBase, name);
      try {
        const stat = fs.statSync(dirPath);
        if (stat.isDirectory() && now - stat.mtimeMs > oneDay) {
          fs.rmSync(dirPath, { recursive: true, force: true });
        }
      } catch {}
    }
  } catch {}
}

// --- CLI ---
const isCLI = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (!isCLI) { /* imported as module, skip CLI execution */ } else {
cleanOldTempDirs();
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
} // end isCLI
