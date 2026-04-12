const { app, BrowserWindow, dialog } = require("electron");
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
      background: #1e1e1e;
    }

    .editor-header {
      display: flex;
      align-items: center;
      height: 40px;
      padding: 0 16px;
      background: #252526;
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
      width: 100%;
      border: none;
      outline: none;
      resize: none;
      background: #1e1e1e;
      color: #d4d4d4;
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
  </style>
</head>
<body>
  <div class="pane editor-pane">
    <div class="editor-header">
      <svg class="file-icon" viewBox="0 0 24 24"><path d="M20.56 18H3.44C2.65 18 2 17.37 2 16.59V7.41C2 6.63 2.65 6 3.44 6h17.12C21.35 6 22 6.63 22 7.41v9.18c0 .78-.65 1.41-1.44 1.41zM11.5 9.5L7.5 12l4 2.5v-5z" fill="#519aba"/></svg>
      <span class="file-name">${title}.md</span>
    </div>
    <textarea id="editor" spellcheck="false">${escapedMd}</textarea>
  </div>
  <div class="divider" id="divider"></div>
  <div class="pane preview-pane">
    <div class="preview-header">
      <span class="label">Preview</span>
    </div>
    <div class="preview-content" id="preview">
      <article id="content"></article>
    </div>
  </div>

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

    editor.addEventListener('input', renderPreview);
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
