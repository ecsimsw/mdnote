const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const fs = require("fs");
const path = require("path");
const os = require("os");

let buildEditorHtml, getMarkedJs;

async function loadModules() {
  const core = await import("./core.mjs");
  buildEditorHtml = core.buildEditorHtml;
  getMarkedJs = core.getMarkedJs;
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

  const escapedMd = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const html = buildEditorHtml(escapedMd, baseName, {
    markedJs: getMarkedJs(),
    onSave: "window.mdviewer.saveFile(editor.value)",
    onPdf: "window.mdviewer.savePdf()",
  });

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
