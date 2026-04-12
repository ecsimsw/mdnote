const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const fs = require("fs");
const path = require("path");

const os = require("os");

let CSS;
let markedJs;

async function loadModules() {
  const cliModule = await import("./cli.mjs");
  CSS = cliModule.CSS;
  markedJs = fs.readFileSync(
    path.join(__dirname, "node_modules/marked/lib/marked.umd.js"),
    "utf-8"
  );
}

function buildEditorHtml(rawMd, title) {
  const escapedMd = rawMd
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <script>${markedJs}</script>
  <style>
    @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');

    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { height: 100%; overflow: hidden; }
    body {
      font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
      display: flex;
      background: #1e1e1e;
    }

    .pane {
      width: 50%;
      height: 100%;
      overflow-y: auto;
    }

    /* Editor pane */
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

    /* Preview pane */
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

    /* Divider */
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

    /* Reuse cli.mjs styles for preview content */
    ${CSS}

    .preview-content article {
      max-width: none;
      padding: 32px 32px 96px;
    }

    .preview-content .toolbar,
    .preview-content .toc { display: none; }

    /* Header buttons */
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

    .editor-header .ctrl-btn {
      color: #999;
    }
    .editor-header .ctrl-btn:hover {
      background: rgba(255,255,255,0.1);
      color: #ccc;
    }

    .preview-header .ctrl-btn {
      color: #888;
    }
    .preview-header .ctrl-btn:hover {
      background: rgba(0,0,0,0.06);
      color: #555;
    }

    .ctrl-btn .shortcut {
      font-size: 10px;
      opacity: 0.5;
      margin-left: 2px;
    }

    .ctrl-btn svg {
      width: 14px;
      height: 14px;
    }

    .preview-header .ctrl-sep {
      width: 1px;
      height: 16px;
      background: #ddd;
      margin: 0 4px;
    }

    /* Editor search bar */
    .search-bar {
      display: none;
      padding: 8px 16px;
      background: #252526;
      border-bottom: 1px solid #333;
      gap: 8px;
      align-items: center;
      flex-shrink: 0;
    }

    .search-bar.visible {
      display: flex;
    }

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

    .search-bar input:focus {
      border-color: #007aff;
    }

    .search-bar .search-label {
      font-size: 12px;
      color: #888;
      flex-shrink: 0;
    }

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

    .search-bar button:hover {
      background: #4c4c4c;
    }

    .search-bar .close-search {
      background: none;
      border: none;
      color: #888;
      font-size: 16px;
      cursor: pointer;
      padding: 2px 6px;
      margin-left: auto;
    }

    .search-bar .close-search:hover {
      color: #ccc;
    }

    .search-match-info {
      font-size: 11px;
      color: #888;
      min-width: 60px;
    }

    /* Theme menu */
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

    .theme-menu.visible {
      display: grid;
    }

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

    .theme-swatch:hover {
      background: #f0f0f0;
    }

    .theme-swatch.active {
      background: #e8e8e8;
      font-weight: 600;
    }

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
        <button class="ctrl-btn hold-btn" data-action="adjustFontSize" data-delta="-1" title="Decrease font size">A−</button>
        <button class="ctrl-btn hold-btn" data-action="adjustFontSize" data-delta="1" title="Increase font size">A+</button>
        <div class="ctrl-sep"></div>
        <button class="ctrl-btn hold-btn" data-action="adjustLineHeight" data-delta="-0.1" title="Decrease line height">
          <svg viewBox="0 0 14 14" fill="currentColor"><rect x="1" y="2" width="12" height="1.5"/><rect x="1" y="6.5" width="12" height="1.5"/><rect x="1" y="11" width="12" height="1.5"/></svg>
        </button>
        <button class="ctrl-btn hold-btn" data-action="adjustLineHeight" data-delta="0.1" title="Increase line height">
          <svg viewBox="0 0 14 14" fill="currentColor"><rect x="1" y="1" width="12" height="1.5"/><rect x="1" y="6.25" width="12" height="1.5"/><rect x="1" y="11.5" width="12" height="1.5"/></svg>
        </button>
        <div class="ctrl-sep"></div>
        <button class="ctrl-btn hold-btn" data-action="adjustWidth" data-delta="-40" title="Narrower">◁</button>
        <button class="ctrl-btn" id="widthLabel" style="pointer-events:none;color:#aaa;font-size:11px">100%</button>
        <button class="ctrl-btn hold-btn" data-action="adjustWidth" data-delta="40" title="Wider">▷</button>
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

    // Auto-save with debounce
    var saveTimer = null;
    function autoSave() {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(function() {
        window.mdviewer.saveFile(editor.value);
      }, 300);
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
    var currentMaxWidth = 100; // percent

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
      window.mdviewer.savePdf();
    }

    // === Editor search & replace ===
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
      // Select in editor — temporarily readonly to prevent Enter from inserting
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
      // Re-render then highlight
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
      // Scroll to current match
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
      // Flash clean preview, then re-highlight
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
    var themes = [
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
    var currentTheme = '';
    var themeMenuEl = document.getElementById('themeMenu');
    themes.forEach(function(t) {
      var btn = document.createElement('button');
      btn.className = 'theme-swatch' + (t.cls === currentTheme ? ' active' : '');
      btn.innerHTML = '<span class="theme-dot" style="background:' + t.bg + '"></span>' + t.name;
      btn.addEventListener('click', function() {
        currentTheme = t.cls;
        // Apply theme class to body so cli.mjs CSS selectors work
        document.body.className = t.cls || '';
        // Mark active
        themeMenuEl.querySelectorAll('.theme-swatch').forEach(function(s) { s.classList.remove('active'); });
        btn.classList.add('active');
        // Update preview background
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

    // Close theme menu on outside click
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

function createWindow(filePath) {
  const { screen } = require("electron");
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const win = new BrowserWindow({
    width,
    height,
    title: "MarkdownViewer",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  const rawMd = fs.readFileSync(filePath, "utf-8");
  const baseName = path.basename(filePath, ".md");
  const inputDir = path.dirname(path.resolve(filePath));

  // Convert relative image paths to absolute file:// URLs
  const md = rawMd.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, src) => {
    if (/^https?:\/\/|^file:\/\/|^\//.test(src)) return match;
    const absPath = path.resolve(inputDir, src);
    return `![${alt}](file://${absPath})`;
  });

  const html = buildEditorHtml(md, baseName);
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mdviewer-"));
  const tmpFile = path.join(tmpDir, "index.html");
  fs.writeFileSync(tmpFile, html);
  win.loadFile(tmpFile);
  win.setTitle(baseName);

  // PDF export
  ipcMain.handle("save-pdf", async (event) => {
    if (event.sender !== win.webContents) return;
    const { canceled, filePath: savePath } = await dialog.showSaveDialog(win, {
      defaultPath: baseName + ".pdf",
      filters: [{ name: "PDF", extensions: ["pdf"] }],
    });
    if (canceled) return;
    const pdfData = await win.webContents.printToPDF({
      printBackground: true,
      pageSize: "A4",
    });
    fs.writeFileSync(savePath, pdfData);
  });

  // Auto-save: write back to original file
  ipcMain.on("save-file", (event, content) => {
    if (event.sender === win.webContents) {
      fs.writeFileSync(filePath, content, "utf-8");
    }
  });

  win.on("closed", () => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
}

async function openFileDialog() {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: "Select a Markdown file",
    filters: [{ name: "Markdown", extensions: ["md", "markdown"] }],
    properties: ["openFile", "multiSelections"],
  });
  if (!canceled) {
    for (const fp of filePaths) {
      createWindow(fp);
    }
  }
}

app.whenReady().then(async () => {
  await loadModules();

  const args = process.argv.slice(app.isPackaged ? 1 : 2);
  const mdFiles = args.filter(
    (a) => !a.startsWith("-") && (a.endsWith(".md") || a.endsWith(".markdown"))
  );

  if (mdFiles.length > 0) {
    for (const fp of mdFiles) {
      if (fs.existsSync(fp)) {
        createWindow(path.resolve(fp));
      }
    }
  } else {
    await openFileDialog();
  }

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await openFileDialog();
    }
  });
});

app.on("open-file", (event, filePath) => {
  event.preventDefault();
  if (app.isReady()) {
    createWindow(filePath);
  } else {
    app.whenReady().then(() => createWindow(filePath));
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
