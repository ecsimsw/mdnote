# How mdviewer works

## Overview

mdviewer is a Markdown viewer for macOS. It has two layers:

1. **CLI** (`mdviewer`) — a Node.js script that converts `.md` files to styled HTML and opens them in a browser.
2. **macOS App** (`MarkdownViewer.app`) — an AppleScript wrapper that calls the CLI, allowing double-click-to-open for `.md` files.

Both are distributed via Homebrew.

## CLI

The CLI is a single-file Node.js script (`cli.mjs`) published to npm as `@ecsimsw/mdviewer`.

### Flow

```
.md file → marked (parse) → styled HTML string → temp file → open in browser
```

1. Reads the input `.md` file.
2. Converts Markdown to HTML using [marked](https://github.com/markedjs/marked).
3. Wraps the HTML with inline CSS (Pretendard font, typography, zoom toolbar, print styles).
4. Writes the result to a temporary directory (`os.tmpdir()`).
5. Opens the HTML file in the default browser (`open` on macOS, `xdg-open` on Linux, `start` on Windows).
6. After 60 seconds, the temp file is automatically deleted.

If `--out <dir>` is specified, the HTML is saved permanently to that directory instead.

### Zoom and PDF

The generated HTML includes a small floating toolbar with:

- **Zoom controls** (50%–200%) — adjusts `content.style.zoom` via JavaScript.
- **PDF button** — calls `window.print()`, which triggers the browser's print dialog. Print-specific CSS (`@media print`) removes the toolbar and reformats for A4.

## macOS App (MarkdownViewer.app)

The `.app` is an AppleScript applet compiled with `osacompile`. It acts as a bridge between macOS Finder and the CLI.

### How it works

```
Double-click .md → macOS calls MarkdownViewer.app → AppleScript runs `mdviewer <file>` → browser opens
```

The AppleScript handles two entry points:

- **`on open`** — triggered when files are dropped onto the app or opened via Finder association. Filters for `.md`/`.markdown` extensions, then calls `mdviewer` for each file.
- **`on run`** — triggered when the app is launched directly (no file argument). Shows a file picker dialog filtered to `.md` files.

The script calls the CLI via `do shell script` with `/usr/local/bin` and `/opt/homebrew/bin` in PATH, so it finds `mdviewer` regardless of whether Homebrew is Intel or Apple Silicon.

### Bundle metadata

The app's `Info.plist` declares:

- `CFBundleIdentifier`: `com.ecsimsw.markdown-viewer`
- `CFBundleDocumentTypes`: associates `.md` and `.markdown` extensions with the app as a Viewer.

This allows macOS to list MarkdownViewer in "Open With" for Markdown files.

## Distribution

### npm (CLI only)

```bash
npm install -g @ecsimsw/mdviewer
```

Installs the `mdviewer` command globally. Works on macOS, Linux, and Windows.

### Homebrew Cask (macOS app + CLI)

```bash
brew tap ecsimsw/tap
brew install --cask mdviewer
```

The Cask formula (`ecsimsw/homebrew-tap`) does the following:

1. Installs `node` as a dependency (via Homebrew formula).
2. Downloads `MarkdownViewer.app.zip` from the GitHub Release.
3. Moves `MarkdownViewer.app` to `/Applications`.
4. Runs `npm install -g @ecsimsw/mdviewer` as a post-install step to make the CLI available.

### Release process

To publish a new version:

1. Update `version` in `package.json`.
2. `npm publish` to update the npm package.
3. Build the `.app` locally (run `osacompile` with the AppleScript source).
4. Zip the `.app` and upload it to a new GitHub Release.
5. Update `version` and `sha256` in `Casks/mdviewer.rb` in the `homebrew-tap` repo.
