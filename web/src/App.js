import { useState, useRef, useEffect, useCallback } from 'react';
import { marked } from 'marked';
import THEMES from './themes';
import './styles/editor.css';
import './styles/preview.css';
import './styles/themes.css';

marked.use({
  breaks: true,
  tokenizer: {
    del(src) {
      const match = /^~~(?=\S)([\s\S]*?\S)~~/.exec(src);
      if (match) {
        return { type: 'del', raw: match[0], text: match[1] };
      }
    }
  },
  renderer: {
    image(token) {
      let alt = token.text || '';
      let width = '';
      let align = '';
      let offset = '';
      const parts = alt.split('|');
      if (parts.length >= 2) {
        const parsed = parts.slice(1).map(s => s.trim());
        const remaining = [];
        parsed.forEach(p => {
          if (/^-?\d+$/.test(p) && !width) width = p;
          else if (/^-?\d+$/.test(p)) offset = p;
          else if (['left', 'center', 'right'].includes(p)) align = p;
          else if (/^x-?\d+$/.test(p)) offset = p.substring(1);
          else remaining.push(p);
        });
        alt = [parts[0].trim(), ...remaining].join('|');
      }
      const widthAttr = width ? ` width="${width}"` : '';
      const alignAttr = align ? ` data-align="${align}"` : '';
      const offsetAttr = offset ? ` data-offset="${offset}"` : '';
      const title = token.title ? ` title="${token.title}"` : '';
      return `<img src="${token.href}" alt="${alt}"${title}${widthAttr}${alignAttr}${offsetAttr} data-raw-alt="${token.text || ''}" />`;
    }
  }
});


const SAMPLE_MD = `# Hello, Mdviewer

Write **Markdown** on the left, see the preview on the right.

## Features

- Real-time preview
- 12 themes
- Font size, line height, width controls
- Find & replace
- PDF export
- Drag to resize panes

\`\`\`js
console.log("Hello, world!");
\`\`\`

> This is a blockquote.

| Name | Value |
|------|-------|
| A    | 1     |
| B    | 2     |
`;

function loadSetting(key, fallback) {
  try {
    const v = localStorage.getItem('mdeditor_' + key);
    return v !== null ? JSON.parse(v) : fallback;
  } catch { return fallback; }
}

function saveSetting(key, value) {
  localStorage.setItem('mdeditor_' + key, JSON.stringify(value));
}

const DEFAULT_THEME = THEMES.find(t => t.cls === '') || THEMES[0];
const DEFAULT_EDITOR_THEME = THEMES.find(t => t.cls === 'dark') || THEMES[1];

function App() {
  const [docs, setDocs] = useState(() => {
    const saved = loadSetting('docs', null);
    if (saved && saved.length > 0) return saved;
    const id = Date.now();
    const initial = [{ id, title: '무제', content: loadSetting('md', SAMPLE_MD), updatedAt: id }];
    saveSetting('docs', initial);
    saveSetting('currentDocId', id);
    return initial;
  });
  const [currentDocId, setCurrentDocId] = useState(() => loadSetting('currentDocId', null));
  const [docMenuVisible, setDocMenuVisible] = useState(false);
  const [renamingDocId, setRenamingDocId] = useState(null);
  const [renamingTitle, setRenamingTitle] = useState('');
  const renameInputRef = useRef(null);
  const docBtnRef = useRef(null);
  const docMenuRef = useRef(null);

  const [md, setMdRaw] = useState(() => loadSetting('md', SAMPLE_MD));
  const undoStack = useRef([]);
  const redoStack = useRef([]);
  const isUndoRedo = useRef(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const setMd = useCallback((newVal) => {
    setMdRaw(prev => {
      if (!isUndoRedo.current) {
        undoStack.current.push(prev);
        if (undoStack.current.length > 50) undoStack.current.shift();
        redoStack.current = [];
      }
      setCanUndo(undoStack.current.length > 0);
      setCanRedo(redoStack.current.length > 0);
      return typeof newVal === 'function' ? newVal(prev) : newVal;
    });
  }, []);

  const undo = useCallback(() => {
    if (undoStack.current.length === 0) return;
    setMdRaw(prev => {
      redoStack.current.push(prev);
      isUndoRedo.current = true;
      const val = undoStack.current.pop();
      setCanUndo(undoStack.current.length > 0);
      setCanRedo(redoStack.current.length > 0);
      setTimeout(() => { isUndoRedo.current = false; }, 0);
      return val;
    });
  }, []);

  const redo = useCallback(() => {
    if (redoStack.current.length === 0) return;
    setMdRaw(prev => {
      undoStack.current.push(prev);
      isUndoRedo.current = true;
      const val = redoStack.current.pop();
      setCanUndo(undoStack.current.length > 0);
      setCanRedo(redoStack.current.length > 0);
      setTimeout(() => { isUndoRedo.current = false; }, 0);
      return val;
    });
  }, []);
  const [theme, setTheme] = useState(() => {
    const cls = loadSetting('theme', '');
    return THEMES.find(t => t.cls === cls) || DEFAULT_THEME;
  });
  const [fontSize, setFontSize] = useState(() => loadSetting('fontSize', 15.5));
  const [lineHeight, setLineHeight] = useState(() => loadSetting('lineHeight', 1.6));
  const [maxWidth, setMaxWidth] = useState(() => loadSetting('maxWidth', 100));
  const [topPadding, setTopPadding] = useState(() => loadSetting('topPadding', 40));
  const [pdfZoom, setPdfZoom] = useState(() => loadSetting('pdfZoom', 65));
  const [pdfZoomMenuVisible, setPdfZoomMenuVisible] = useState(false);
  const [pdfZoomInput, setPdfZoomInput] = useState(String(pdfZoom));
  const [fontMenuVisible, setFontMenuVisible] = useState(false);
  const [fontFamily, setFontFamily] = useState(() => loadSetting('fontFamily', 'Pretendard'));
  const fontBtnRef = useRef(null);
  const fontMenuRef = useRef(null);
  const FONTS = [
    { name: 'Gowun Batang', value: "'Gowun Batang', serif", url: 'https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&display=swap', lang: '한' },
    { name: 'Gowun Dodum', value: "'Gowun Dodum', sans-serif", url: 'https://fonts.googleapis.com/css2?family=Gowun+Dodum&display=swap', lang: '한' },
    { name: 'IBM Plex Sans KR', value: "'IBM Plex Sans KR', sans-serif", url: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@400;700&display=swap', lang: '한' },
    { name: 'Nanum Gothic', value: "'Nanum Gothic', sans-serif", url: 'https://fonts.googleapis.com/css2?family=Nanum+Gothic:wght@400;700&display=swap', lang: '한' },
    { name: 'Nanum Myeongjo', value: "'Nanum Myeongjo', serif", url: 'https://fonts.googleapis.com/css2?family=Nanum+Myeongjo:wght@400;700&display=swap', lang: '한' },
    { name: 'Noto Sans KR', value: "'Noto Sans KR', sans-serif", url: 'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700&display=swap', lang: '한' },
    { name: 'Pretendard', value: "'Pretendard', -apple-system, sans-serif", url: null, lang: '한' },
    { name: 'Spoqa Han Sans', value: "'Spoqa Han Sans Neo', sans-serif", url: 'https://spoqa.github.io/spoqa-han-sans/css/SpoqaHanSansNeo.css', lang: '한' },
    { name: 'D2Coding', value: "'D2Coding', monospace", url: 'https://cdn.jsdelivr.net/gh/joungkyun/font-d2coding/d2coding.css', lang: '한' },
    { name: 'Crimson Text', value: "'Crimson Text', serif", url: 'https://fonts.googleapis.com/css2?family=Crimson+Text:wght@400;700&display=swap', lang: 'E' },
    { name: 'Garamond', value: "'EB Garamond', serif", url: 'https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;700&display=swap', lang: 'E' },
    { name: 'Inter', value: "'Inter', sans-serif", url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap', lang: 'E' },
    { name: 'Lora', value: "'Lora', serif", url: 'https://fonts.googleapis.com/css2?family=Lora:wght@400;700&display=swap', lang: 'E' },
    { name: 'Merriweather', value: "'Merriweather', serif", url: 'https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&display=swap', lang: 'E' },
    { name: 'Playfair Display', value: "'Playfair Display', serif", url: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap', lang: 'E' },
    { name: 'Roboto', value: "'Roboto', sans-serif", url: 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap', lang: 'E' },
    { name: 'Open Sans', value: "'Open Sans', sans-serif", url: 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;700&display=swap', lang: 'E' },
    { name: 'PT Serif', value: "'PT Serif', serif", url: 'https://fonts.googleapis.com/css2?family=PT+Serif:wght@400;700&display=swap', lang: 'E' },
    { name: 'Source Sans 3', value: "'Source Sans 3', sans-serif", url: 'https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;700&display=swap', lang: 'E' },
    { name: 'Source Serif 4', value: "'Source Serif 4', serif", url: 'https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@400;700&display=swap', lang: 'E' },
  ];
  const [editorVisible, setEditorVisible] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const dropCursorRef = useRef(null);
  const [searchVisible, setSearchVisible] = useState(false);
  const [replaceVisible, setReplaceVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [matches, setMatches] = useState([]);
  const [currentMatch, setCurrentMatch] = useState(-1);
  const [themeMenuVisible, setThemeMenuVisible] = useState(false);
  const [editorTheme, setEditorTheme] = useState(() => {
    const cls = loadSetting('editorTheme', 'dark');
    return THEMES.find(t => t.cls === cls) || DEFAULT_EDITOR_THEME;
  });
  const [editorThemeMenuVisible, setEditorThemeMenuVisible] = useState(false);
  const [listMenuVisible, setListMenuVisible] = useState(false);
  const [listStyle, setListStyle] = useState(() => loadSetting('listStyle', 0));
  const [paneRatio, setPaneRatio] = useState(() => loadSetting('paneRatio', 50));
  const [customListChar, setCustomListChar] = useState(() => loadSetting('customListChar', '★'));
  const LIST_STYLES = [
    { label: '•', type: 'disc' },
    { label: '–', type: '"–  "' },
    { label: '‣', type: '"‣  "' },
    { label: '■', type: 'square' },
    { label: '1.', type: 'decimal' },
    { label: 'a.', type: 'lower-alpha' },
    { label: '가.', type: 'korean-syllable' },
    { label: 'i.', type: 'lower-roman' },
    { label: '김', type: 'kim-jin-hwan' },
    { label: customListChar, type: `"${customListChar}  "`, custom: true },
  ];

  const editorRef = useRef(null);
  const previewRef = useRef(null);
  const contentRef = useRef(null);
  const themeBtnRef = useRef(null);
  const themeMenuRef = useRef(null);
  const listBtnRef = useRef(null);
  const listMenuRef = useRef(null);
  const dividerRef = useRef(null);
  const dividerDotRef = useRef(null);
  const pdfZoomBtnRef = useRef(null);
  const pdfZoomMenuRef = useRef(null);
  const editorThemeBtnRef = useRef(null);
  const editorThemeMenuRef = useRef(null);
  const isDragging = useRef(false);

  // Persist settings to localStorage
  useEffect(() => { saveSetting('theme', theme.cls); }, [theme]);
  useEffect(() => { saveSetting('editorTheme', editorTheme.cls); }, [editorTheme]);
  useEffect(() => { saveSetting('fontSize', fontSize); }, [fontSize]);
  useEffect(() => { saveSetting('pdfZoom', pdfZoom); }, [pdfZoom]);
  useEffect(() => { saveSetting('docs', docs); }, [docs]);
  useEffect(() => { saveSetting('currentDocId', currentDocId); }, [currentDocId]);
  useEffect(() => { saveSetting('lineHeight', lineHeight); }, [lineHeight]);
  useEffect(() => { saveSetting('maxWidth', maxWidth); }, [maxWidth]);
  useEffect(() => { saveSetting('topPadding', topPadding); }, [topPadding]);
  useEffect(() => { saveSetting('fontFamily', fontFamily); }, [fontFamily]);

  const getDocTitle = (content) => {
    const first = content.trim().split('\n')[0] || '';
    return first.replace(/^#+\s*/, '').slice(0, 30) || '제목 없음';
  };

  const [newDocInputVisible, setNewDocInputVisible] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const newDocInputRef = useRef(null);

  const openNewDocInput = () => {
    setNewDocTitle('');
    setNewDocInputVisible(true);
    setTimeout(() => newDocInputRef.current?.focus(), 50);
  };

  const confirmNewDoc = () => {
    const title = newDocTitle.trim() || '제목 없음';
    const id = Date.now();
    setDocs(prev => [{ id, title, content: '', updatedAt: Date.now() }, ...prev].slice(0, 20));
    setMdRaw('');
    undoStack.current = [];
    redoStack.current = [];
    setCurrentDocId(id);
    setNewDocInputVisible(false);
    setDocMenuVisible(false);
  };

  const loadDoc = (doc) => {
    setMdRaw(doc.content);
    undoStack.current = [];
    redoStack.current = [];
    setCurrentDocId(doc.id);
    setDocMenuVisible(false);
  };

  const startRename = (doc, e) => {
    e.stopPropagation();
    setRenamingDocId(doc.id);
    setRenamingTitle(doc.title);
    setTimeout(() => renameInputRef.current?.select(), 50);
  };

  const confirmRename = () => {
    const title = renamingTitle.trim() || '무제';
    setDocs(prev => prev.map(d => d.id === renamingDocId ? { ...d, title } : d));
    setRenamingDocId(null);
  };

  const deleteDoc = (id, e) => {
    e.stopPropagation();
    setDocs(prev => prev.filter(d => d.id !== id));
    if (currentDocId === id) setCurrentDocId(null);
  };

  // Load Google Font
  useEffect(() => {
    const font = FONTS.find(f => f.name === fontFamily);
    if (font && font.url) {
      const id = 'gfont-' + fontFamily.replace(/\s/g, '-');
      if (!document.getElementById(id)) {
        const link = document.createElement('link');
        link.id = id;
        link.rel = 'stylesheet';
        link.href = font.url;
        document.head.appendChild(link);
      }
    }
  }, [fontFamily]);
  useEffect(() => { saveSetting('listStyle', listStyle); }, [listStyle]);
  useEffect(() => { saveSetting('customListChar', customListChar); }, [customListChar]);
  useEffect(() => { saveSetting('paneRatio', paneRatio); }, [paneRatio]);
  const mdRef = useRef(md);
  const currentDocIdRef = useRef(currentDocId);
  mdRef.current = md;
  currentDocIdRef.current = currentDocId;

  const [savedVisible, setSavedVisible] = useState(false);
  const savedTimerRef = useRef(null);
  const [actionToast, setActionToast] = useState('');
  const actionToastTimerRef = useRef(null);

  const flushSave = useCallback((showIndicator) => {
    saveSetting('md', mdRef.current);
    if (currentDocIdRef.current) {
      setDocs(prev => prev.map(d => d.id === currentDocIdRef.current ? { ...d, content: mdRef.current, updatedAt: Date.now() } : d));
    }
    if (showIndicator) {
      setSavedVisible(true);
      clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => setSavedVisible(false), 1000);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(flushSave, 500);
    return () => clearTimeout(timer);
  }, [md, currentDocId, flushSave]);

  // Apply theme to body
  useEffect(() => {
    document.body.className = theme.cls || '';
    document.body.style.backgroundColor = theme.bg;
  }, [theme]);

  // Find matches
  useEffect(() => {
    if (!searchQuery) { setMatches([]); setCurrentMatch(-1); return; }
    const lower = md.toLowerCase();
    const q = searchQuery.toLowerCase();
    const found = [];
    let idx = 0;
    while ((idx = lower.indexOf(q, idx)) !== -1) {
      found.push(idx);
      idx += q.length;
    }
    setMatches(found);
    setCurrentMatch(found.length > 0 ? 0 : -1);
  }, [searchQuery, md]);

  // Highlight in preview
  useEffect(() => {
    if (!contentRef.current) return;
    contentRef.current.innerHTML = marked.parse(md);

    // Add image resize handles + alignment controls
    const updateImgMd = (img, newWidth, newAlign, newOffset) => {
      const rawAlt = img.getAttribute('data-raw-alt') || '';
      const src = img.src;
      const parts = rawAlt.split('|');
      const cleanAlt = parts[0].trim() || img.alt || 'image';
      const oldPattern = `![${rawAlt}](${src})`;
      const suffixes = [];
      if (newWidth) suffixes.push(newWidth);
      if (newAlign && newAlign !== 'left') suffixes.push(newAlign);
      if (newOffset && Number(newOffset) !== 0) suffixes.push('x' + newOffset);
      const newAltFull = suffixes.length > 0 ? `${cleanAlt}|${suffixes.join('|')}` : cleanAlt;
      const newPattern = `![${newAltFull}](${src})`;
      if (mdRef.current.includes(oldPattern)) {
        setMd(mdRef.current.replace(oldPattern, newPattern));
      }
    };

    contentRef.current.querySelectorAll('img').forEach(img => {
      const align = img.getAttribute('data-align') || 'left';
      const offset = parseInt(img.getAttribute('data-offset') || '0', 10);
      const wrapper = document.createElement('span');
      const justifyMap = { left: 'flex-start', center: 'center', right: 'flex-end' };
      wrapper.style.cssText = `display:flex;justify-content:${justifyMap[align] || 'flex-start'};position:relative;max-width:100%;`;

      const inner = document.createElement('span');
      inner.style.cssText = `display:inline-block;position:relative;max-width:100%;${offset ? `transform:translateX(${offset}px);` : ''}`;
      img.parentNode.insertBefore(wrapper, img);
      wrapper.appendChild(inner);
      inner.appendChild(img);
      img.style.cssText = 'display:block;max-width:100%;height:auto;' + (img.getAttribute('width') ? `width:${img.getAttribute('width')}px;` : '');

      // Toolbar (align buttons)
      const toolbar = document.createElement('span');
      toolbar.style.cssText = 'position:absolute;top:6px;left:50%;transform:translateX(-50%);display:flex;gap:2px;background:rgba(0,0,0,.55);border-radius:6px;padding:3px 4px;opacity:0;transition:opacity .15s;z-index:10;';
      inner.appendChild(toolbar);

      // Nudge left button
      const nudgeLeftBtn = document.createElement('span');
      nudgeLeftBtn.innerHTML = '<svg viewBox="0 0 18 15" width="12" height="12"><path d="M6 7.5L12 4v7z" fill="white"/></svg>';
      nudgeLeftBtn.style.cssText = 'cursor:pointer;padding:3px 5px;border-radius:4px;display:flex;align-items:center;';
      nudgeLeftBtn.onclick = (e) => {
        e.stopPropagation();
        const curWidth = img.getAttribute('width') || '';
        updateImgMd(img, curWidth, align, String(offset - 20));
      };
      toolbar.appendChild(nudgeLeftBtn);

      // Separator
      const sep1 = document.createElement('span');
      sep1.style.cssText = 'width:1px;height:12px;background:rgba(255,255,255,.25);margin:0 1px;';
      toolbar.appendChild(sep1);

      ['left', 'center', 'right'].forEach(a => {
        const btn = document.createElement('span');
        const lines = a === 'left' ? '4,4 14,4 4,7.5 12,7.5 4,11 14,11'
          : a === 'center' ? '4,4 14,4 5,7.5 13,7.5 4,11 14,11'
          : '4,4 14,4 6,7.5 14,7.5 4,11 14,11';
        btn.innerHTML = `<svg viewBox="0 0 18 15" width="14" height="12"><line x1="${lines.split(' ')[0].split(',')[0]}" y1="${lines.split(' ')[0].split(',')[1]}" x2="${lines.split(' ')[1].split(',')[0]}" y2="${lines.split(' ')[1].split(',')[1]}" stroke="white" stroke-width="1.5"/><line x1="${lines.split(' ')[2].split(',')[0]}" y1="${lines.split(' ')[2].split(',')[1]}" x2="${lines.split(' ')[3].split(',')[0]}" y2="${lines.split(' ')[3].split(',')[1]}" stroke="white" stroke-width="1.5"/><line x1="${lines.split(' ')[4].split(',')[0]}" y1="${lines.split(' ')[4].split(',')[1]}" x2="${lines.split(' ')[5].split(',')[0]}" y2="${lines.split(' ')[5].split(',')[1]}" stroke="white" stroke-width="1.5"/></svg>`;
        btn.style.cssText = `cursor:pointer;padding:3px 5px;border-radius:4px;display:flex;align-items:center;${a === align ? 'background:rgba(255,255,255,.25);' : ''}`;
        btn.onclick = (e) => {
          e.stopPropagation();
          const curWidth = img.getAttribute('width') || '';
          updateImgMd(img, curWidth, a, offset ? String(offset) : '');
        };
        toolbar.appendChild(btn);
      });

      // Separator
      const sep2 = document.createElement('span');
      sep2.style.cssText = 'width:1px;height:12px;background:rgba(255,255,255,.25);margin:0 1px;';
      toolbar.appendChild(sep2);

      // Nudge right button
      const nudgeRightBtn = document.createElement('span');
      nudgeRightBtn.innerHTML = '<svg viewBox="0 0 18 15" width="12" height="12"><path d="M12 7.5L6 4v7z" fill="white"/></svg>';
      nudgeRightBtn.style.cssText = 'cursor:pointer;padding:3px 5px;border-radius:4px;display:flex;align-items:center;';
      nudgeRightBtn.onclick = (e) => {
        e.stopPropagation();
        const curWidth = img.getAttribute('width') || '';
        updateImgMd(img, curWidth, align, String(offset + 20));
      };
      toolbar.appendChild(nudgeRightBtn);

      // Separator
      const sep3 = document.createElement('span');
      sep3.style.cssText = 'width:1px;height:12px;background:rgba(255,255,255,.25);margin:0 1px;';
      toolbar.appendChild(sep3);

      // Delete button
      const delBtn = document.createElement('span');
      delBtn.innerHTML = '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="white" stroke-width="2.5"><path d="M6 6l12 12"/><path d="M18 6L6 18"/></svg>';
      delBtn.style.cssText = 'cursor:pointer;padding:3px 5px;border-radius:4px;display:flex;align-items:center;';
      delBtn.onclick = (e) => {
        e.stopPropagation();
        const rawAlt = img.getAttribute('data-raw-alt') || '';
        const src = img.src;
        const pattern = `![${rawAlt}](${src})`;
        if (mdRef.current.includes(pattern)) {
          setMd(mdRef.current.replace(pattern, ''));
        }
      };
      toolbar.appendChild(delBtn);

      // Resize handle
      const handle = document.createElement('span');
      handle.style.cssText = 'position:absolute;right:0;bottom:0;width:16px;height:16px;cursor:nwse-resize;opacity:0;transition:opacity .15s;background:linear-gradient(135deg,transparent 50%,rgba(0,122,255,.5) 50%);border-radius:0 0 2px 0;';
      inner.appendChild(handle);

      inner.onmouseenter = () => { handle.style.opacity = '1'; toolbar.style.opacity = '1'; };
      inner.onmouseleave = () => { if (!handle.dragging) { handle.style.opacity = '0'; toolbar.style.opacity = '0'; } };

      handle.onmousedown = (e) => {
        e.preventDefault();
        handle.dragging = true;
        const startX = e.clientX;
        const startW = img.offsetWidth;
        const onMove = (ev) => {
          const newW = Math.max(30, startW + ev.clientX - startX);
          img.style.width = newW + 'px';
        };
        const onUp = () => {
          handle.dragging = false;
          handle.style.opacity = '0';
          toolbar.style.opacity = '0';
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
          const finalW = Math.round(img.offsetWidth);
          updateImgMd(img, String(finalW), align, offset ? String(offset) : '');
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      };
    });

    // Add copy buttons
    contentRef.current.querySelectorAll('pre').forEach(pre => {
      const btn = document.createElement('button');
      btn.className = 'copy-btn';
      btn.textContent = 'Copy';
      btn.onclick = () => {
        const code = pre.querySelector('code');
        navigator.clipboard.writeText(code ? code.textContent : pre.textContent);
        btn.textContent = 'Copied!';
        setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
      };
      pre.appendChild(btn);
    });

    // Highlight search matches (only in Find mode, not Replace)
    if (!searchQuery || !searchVisible) return;
    const walk = document.createTreeWalker(contentRef.current, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walk.nextNode()) nodes.push(walk.currentNode);
    const lowerQ = searchQuery.toLowerCase();
    let matchIdx = 0;
    nodes.forEach(node => {
      if (node.parentNode.tagName === 'SCRIPT' || node.parentNode.tagName === 'STYLE') return;
      const text = node.textContent;
      const lowerText = text.toLowerCase();
      const parts = [];
      let lastIdx = 0;
      let i;
      while ((i = lowerText.indexOf(lowerQ, lastIdx)) !== -1) {
        if (i > lastIdx) parts.push(document.createTextNode(text.substring(lastIdx, i)));
        const mark = document.createElement('mark');
        mark.className = matchIdx === currentMatch ? 'highlight highlight-current' : 'highlight';
        mark.textContent = text.substring(i, i + searchQuery.length);
        parts.push(mark);
        matchIdx++;
        lastIdx = i + searchQuery.length;
      }
      if (parts.length > 0) {
        if (lastIdx < text.length) parts.push(document.createTextNode(text.substring(lastIdx)));
        const span = document.createElement('span');
        parts.forEach(p => span.appendChild(p));
        node.parentNode.replaceChild(span, node);
      }
    });

    const current = contentRef.current.querySelector('.highlight-current');
    if (current) current.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [md, searchQuery, currentMatch]);

  // Divider drag
  useEffect(() => {
    const onMouseMove = (e) => {
      if (dividerDotRef.current && dividerRef.current) {
        dividerDotRef.current.style.top = e.clientY + 'px';
        const rect = dividerRef.current.getBoundingClientRect();
        const near = Math.abs(e.clientX - rect.left) < 20 || isDragging.current;
        dividerDotRef.current.classList.toggle('visible', near);
      }
      if (!isDragging.current) return;
      const ratio = Math.max(20, Math.min(80, e.clientX / window.innerWidth * 100));
      setPaneRatio(ratio);
    };
    const onMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  // Scroll sync
  const onEditorScroll = () => {
    if (!editorRef.current || !previewRef.current) return;
    const editor = editorRef.current;
    const ratio = editor.scrollTop / (editor.scrollHeight - editor.clientHeight);
    previewRef.current.scrollTop = ratio * (previewRef.current.scrollHeight - previewRef.current.clientHeight);
  };

  // Tab key
  const onEditorKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const el = editorRef.current;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const newVal = md.substring(0, start) + '  ' + md.substring(end);
      setMd(newVal);
      setTimeout(() => { el.selectionStart = el.selectionEnd = start + 2; }, 0);
    }
  };

  // Cmd+F
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        setSearchVisible(v => {
          if (v) { setSearchQuery(''); }
          setReplaceVisible(false);
          return !v;
        });
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          if (redoStack.current.length > 0) {
            redo();
            setActionToast('Redo');
            clearTimeout(actionToastTimerRef.current);
            actionToastTimerRef.current = setTimeout(() => setActionToast(''), 800);
          }
        } else {
          if (undoStack.current.length > 0) {
            undo();
            setActionToast('Undo');
            clearTimeout(actionToastTimerRef.current);
            actionToastTimerRef.current = setTimeout(() => setActionToast(''), 800);
          }
        }
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        setFontSize(f => Math.min(100, f + 1));
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '-') {
        e.preventDefault();
        setFontSize(f => Math.max(8, f - 1));
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '[') {
        e.preventDefault();
        setMaxWidth(w => Math.max(40, w - 5));
      }
      if ((e.metaKey || e.ctrlKey) && e.key === ']') {
        e.preventDefault();
        setMaxWidth(w => Math.min(100, w + 5));
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        e.preventDefault();
        setDocMenuVisible(true);
        openNewDocInput();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
        e.preventDefault();
        setReplaceVisible(v => {
          if (v) { setSearchQuery(''); setReplaceQuery(''); }
          return !v;
        });
        setSearchVisible(false);
        setEditorVisible(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        flushSave(true);
      }
      // Auto-focus editor on typing when nothing is focused
      if (!e.metaKey && !e.ctrlKey && !e.altKey && e.key.length === 1 &&
          document.activeElement === document.body && editorRef.current) {
        editorRef.current.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [undo, redo, flushSave]);

  // Close theme menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target) &&
          themeBtnRef.current && !themeBtnRef.current.contains(e.target)) {
        setThemeMenuVisible(false);
      }
      if (listMenuRef.current && !listMenuRef.current.contains(e.target) &&
          listBtnRef.current && !listBtnRef.current.contains(e.target)) {
        setListMenuVisible(false);
      }
      if (editorThemeMenuRef.current && !editorThemeMenuRef.current.contains(e.target) &&
          editorThemeBtnRef.current && !editorThemeBtnRef.current.contains(e.target)) {
        setEditorThemeMenuVisible(false);
      }
      if (fontMenuRef.current && !fontMenuRef.current.contains(e.target) &&
          fontBtnRef.current && !fontBtnRef.current.contains(e.target)) {
        setFontMenuVisible(false);
      }
      if (pdfZoomMenuRef.current && !pdfZoomMenuRef.current.contains(e.target) &&
          pdfZoomBtnRef.current && !pdfZoomBtnRef.current.contains(e.target)) {
        setPdfZoomMenuVisible(false);
      }
      if (docMenuRef.current && !docMenuRef.current.contains(e.target) &&
          docBtnRef.current && !docBtnRef.current.contains(e.target) &&
          !e.target.closest('.list-menu')) {
        setDocMenuVisible(false);
        setNewDocInputVisible(false);
        setRenamingDocId(null);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const findNext = () => {
    if (matches.length === 0) return;
    setCurrentMatch(m => (m + 1) % matches.length);
  };

  const findPrev = () => {
    if (matches.length === 0) return;
    setCurrentMatch(m => (m - 1 + matches.length) % matches.length);
  };

  const replaceCurrent = () => {
    if (currentMatch < 0 || currentMatch >= matches.length) return;
    const pos = matches[currentMatch];
    setMd(md.substring(0, pos) + replaceQuery + md.substring(pos + searchQuery.length));
  };

  const replaceAll = () => {
    if (!searchQuery) return;
    const regex = new RegExp(searchQuery.replace(/[-/\\^$*+?.()|[\]]/g, '\\$&'), 'gi');
    setMd(md.replace(regex, replaceQuery));
  };

  const onSearchKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); e.shiftKey ? findPrev() : findNext(); }
    if (e.key === 'Escape') { setSearchVisible(false); setSearchQuery(''); }
  };

  // Markdown formatting
  const wrapSelection = (before, after) => {
    const el = editorRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = md.substring(start, end);
    const aft = after || '';

    // Check if already wrapped → unwrap (toggle off)
    const beforeText = md.substring(start - before.length, start);
    const afterText = md.substring(end, end + aft.length);
    if (beforeText === before && afterText === aft) {
      const newText = md.substring(0, start - before.length) + selected + md.substring(end + aft.length);
      setMd(newText);
      setTimeout(() => {
        el.focus();
        el.selectionStart = start - before.length;
        el.selectionEnd = start - before.length + selected.length;
      }, 0);
      return;
    }

    const newText = md.substring(0, start) + before + selected + aft + md.substring(end);
    setMd(newText);
    setTimeout(() => {
      el.focus();
      el.selectionStart = start + before.length;
      el.selectionEnd = start + before.length + selected.length;
    }, 0);
  };

  const prefixLine = (prefix) => {
    const el = editorRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const lineStart = md.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = md.indexOf('\n', start);
    const line = md.substring(lineStart, lineEnd === -1 ? md.length : lineEnd);

    // Heading toggle: remove existing heading prefix first
    const headingMatch = line.match(/^(#{1,6})\s/);
    let newLine;
    let cursorDelta;

    if (prefix.startsWith('#')) {
      if (headingMatch && headingMatch[0] === prefix) {
        // Same prefix → remove it (toggle off)
        newLine = line.substring(prefix.length);
        cursorDelta = -prefix.length;
      } else if (headingMatch) {
        // Different heading → replace
        newLine = prefix + line.substring(headingMatch[0].length);
        cursorDelta = prefix.length - headingMatch[0].length;
      } else {
        newLine = prefix + line;
        cursorDelta = prefix.length;
      }
    } else {
      // Non-heading prefix (>, -, 1., ---)
      if (line.startsWith(prefix)) {
        newLine = line.substring(prefix.length);
        cursorDelta = -prefix.length;
      } else {
        newLine = prefix + line;
        cursorDelta = prefix.length;
      }
    }

    const newText = md.substring(0, lineStart) + newLine + md.substring(lineEnd === -1 ? md.length : lineEnd);
    setMd(newText);
    setTimeout(() => {
      el.focus();
      el.selectionStart = Math.max(lineStart, start + cursorDelta);
      el.selectionEnd = Math.max(lineStart, end + cursorDelta);
    }, 0);
  };

  // Hold-to-repeat
  const holdRef = useRef({});
  const startHold = (fn) => {
    fn();
    holdRef.current.timer = setTimeout(() => {
      holdRef.current.interval = setInterval(fn, 80);
    }, 400);
  };
  const stopHold = () => {
    clearTimeout(holdRef.current.timer);
    clearInterval(holdRef.current.interval);
  };

  const themeMenuStyle = themeMenuVisible && themeBtnRef.current ? (() => {
    const rect = themeBtnRef.current.getBoundingClientRect();
    return { top: rect.bottom + 4, right: window.innerWidth - rect.right };
  })() : {};

  return (
    <div className="app">
      <div className="pane editor-pane" style={{ width: paneRatio + '%', background: editorTheme.edBg || '#1e1e1e', position: 'relative' }}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'copy';
          // Check if dragging image or md file
          const items = e.dataTransfer.items;
          let isImage = false;
          if (items) {
            for (let i = 0; i < items.length; i++) {
              if (items[i].type.startsWith('image/')) { isImage = true; break; }
            }
          }
          setDragOver(isImage ? 'image' : 'file');
          // Show drop cursor for images
          const el = editorRef.current;
          const cursor = dropCursorRef.current;
          if (isImage && el && cursor) {
            const rect = el.getBoundingClientRect();
            const lineH = parseFloat(getComputedStyle(el).lineHeight) || 20;
            const paddingTop = parseFloat(getComputedStyle(el).paddingTop) || 0;
            const y = e.clientY - rect.top + el.scrollTop;
            const lineIdx = Math.floor((y - paddingTop) / lineH);
            const cursorY = rect.top + paddingTop + lineIdx * lineH - el.scrollTop;
            cursor.style.top = cursorY + 'px';
            cursor.style.left = rect.left + 'px';
            cursor.style.width = rect.width + 'px';
            cursor.style.display = 'block';
          } else if (cursor) {
            cursor.style.display = 'none';
          }
        }}
        onDragLeave={() => {
          setDragOver(false);
          if (dropCursorRef.current) dropCursorRef.current.style.display = 'none';
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (dropCursorRef.current) dropCursorRef.current.style.display = 'none';
          const file = e.dataTransfer.files[0];
          if (file && (file.name.endsWith('.md') || file.name.endsWith('.markdown') || file.name.endsWith('.txt'))) {
            const reader = new FileReader();
            reader.onload = (ev) => {
              const title = file.name.replace(/\.(md|markdown|txt)$/, '');
              const id = Date.now();
              setDocs(prev => [{ id, title, content: ev.target.result, updatedAt: Date.now() }, ...prev].slice(0, 20));
              setMdRaw(ev.target.result);
              undoStack.current = [];
              redoStack.current = [];
              setCurrentDocId(id);
            };
            reader.readAsText(file);
          } else {
            // Handle image files (multiple)
            const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
            if (files.length > 0) {
              // Get drop position in textarea
              const el = editorRef.current;
              let dropPos = el ? el.selectionStart : 0;
              if (el) {
                // Try to find cursor position from drop coordinates
                const rect = el.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top + el.scrollTop;
                const lineH = parseFloat(getComputedStyle(el).lineHeight) || 20;
                const charW = 8;
                const paddingTop = parseFloat(getComputedStyle(el).paddingTop) || 0;
                const paddingLeft = parseFloat(getComputedStyle(el).paddingLeft) || 0;
                const lines = el.value.split('\n');
                const lineIdx = Math.min(Math.floor((y - paddingTop) / lineH), lines.length - 1);
                let pos = 0;
                for (let i = 0; i < lineIdx && i < lines.length; i++) pos += lines[i].length + 1;
                const colIdx = Math.min(Math.floor((x - paddingLeft) / charW), (lines[lineIdx] || '').length);
                dropPos = pos + Math.max(0, colIdx);
              }
              files.forEach((file, i) => {
                const reader = new FileReader();
                reader.onload = (ev) => {
                  const imgMd = `![${file.name}](${ev.target.result})`;
                  setMd(prev => {
                    const pos = Math.min(dropPos, prev.length);
                    return prev.substring(0, pos) + '\n' + imgMd + '\n' + prev.substring(pos);
                  });
                };
                reader.readAsDataURL(file);
              });
            }
          }
        }}>
        {dragOver === 'file' && <div style={{
          position: 'absolute', inset: 0, zIndex: 999,
          background: 'rgba(0,122,255,0.08)',
          border: '2px dashed rgba(0,122,255,0.4)',
          borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
            color: 'rgba(0,122,255,0.7)', fontSize: 14,
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 32, height: 32 }}>
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><polyline points="9 15 12 12 15 15"/>
            </svg>
            Drop .md file
          </div>
        </div>}
        <div className="editor-header" style={{ background: editorTheme.edHeaderBg || '#252526', borderColor: editorTheme.edBorder || '#333' }}>
          <a className="file-name" href="https://github.com/ecsimsw/mdnote" target="_blank" rel="noopener noreferrer"
            style={{ color: editorTheme.edHeaderColor || '#ccc', textDecoration: 'none', cursor: 'pointer', fontWeight: 700, userSelect: 'none' }}>MdEditor</a>
          <div className="header-controls">
            <button className="ctrl-btn" ref={docBtnRef}
              onClick={() => setDocMenuVisible(v => !v)} title="문서 목록"
              style={{ color: editorTheme.edHeaderColor || '#ccc' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}>
                <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
              </svg>
            </button>
            <div className="ctrl-sep" style={{ background: editorTheme.edBorder || '#444' }} />
            <button className="ctrl-btn" onClick={() => {
              setEditorVisible(v => !v);
              setSearchVisible(false);
              setReplaceVisible(false);

              setSearchQuery('');
              setReplaceQuery('');
            }} title="Toggle editor"
              style={{ color: editorTheme.edHeaderColor || '#ccc', opacity: editorVisible && !searchVisible && !replaceVisible ? 1 : 0.4 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}>
                <path d="M17 3a2.85 2.85 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
              </svg>
            </button>
            <div className="ctrl-sep" style={{ background: editorTheme.edBorder || '#444' }} />
            <button className="ctrl-btn" onClick={() => {
              if (undoStack.current.length > 0) {
                undo();
                setActionToast('Undo');
                clearTimeout(actionToastTimerRef.current);
                actionToastTimerRef.current = setTimeout(() => setActionToast(''), 800);
              }
            }} title="Undo"
              style={{ color: editorTheme.edHeaderColor || '#ccc', opacity: canUndo ? 1 : 0.4 }}>↩</button>
            <button className="ctrl-btn" onClick={() => {
              if (redoStack.current.length > 0) {
                redo();
                setActionToast('Redo');
                clearTimeout(actionToastTimerRef.current);
                actionToastTimerRef.current = setTimeout(() => setActionToast(''), 800);
              }
            }} title="Redo"
              style={{ color: editorTheme.edHeaderColor || '#ccc', opacity: canRedo ? 1 : 0.4 }}>↪</button>
            <div className="ctrl-sep" style={{ background: editorTheme.edBorder || '#444' }} />
            <button className="ctrl-btn" onClick={() => {
              setSearchVisible(v => {
                if (v) { setSearchQuery(''); }
                return !v;
              });
              setReplaceVisible(false);
              setEditorVisible(false);

            }} title="Find"
              style={{ color: editorTheme.edHeaderColor || '#ccc' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}>
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
            </button>
            <div className="ctrl-sep" style={{ background: editorTheme.edBorder || '#444' }} />
            <button className="ctrl-btn" onClick={() => {
              setReplaceVisible(v => {
                if (v) { setSearchQuery(''); setReplaceQuery(''); }
                return !v;
              });
              setSearchVisible(false);
              setEditorVisible(false);

            }} title="Replace"
              style={{ color: editorTheme.edHeaderColor || '#ccc' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}>
                <path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 014-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 01-4 4H3"/>
              </svg>
            </button>
            <div className="ctrl-sep" style={{ background: editorTheme.edBorder || '#444' }} />
            <button className="ctrl-btn" ref={editorThemeBtnRef}
              onClick={() => setEditorThemeMenuVisible(v => !v)} title="Editor Theme"
              style={{ color: editorTheme.edHeaderColor || '#ccc' }}>
              <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 14, height: 14 }}>
                <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-1 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
              </svg>
            </button>
            <div className="ctrl-sep" style={{ background: editorTheme.edBorder || '#444' }} />
            <button className="ctrl-btn" onClick={() => {
              navigator.clipboard.writeText(md);
              const btn = document.activeElement;
              const orig = btn.innerHTML;
              btn.innerHTML = '✓';
              setTimeout(() => { btn.innerHTML = orig; }, 1000);
            }} title="Copy to clipboard"
              style={{ color: editorTheme.edHeaderColor || '#ccc' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}>
                <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
              </svg>
            </button>
          </div>
        </div>
        {editorVisible && !searchVisible && !replaceVisible && <div className="md-toolbar" style={{
          background: editorTheme.edHeaderBg || '#252526',
          borderBottom: `1px solid ${editorTheme.edBorder || '#333'}`,
          color: editorTheme.edHeaderColor || '#ccc',
        }}>
          <button onClick={() => prefixLine('# ')} title="Heading 1">H1</button>
          <button onClick={() => prefixLine('## ')} title="Heading 2">H2</button>
          <button onClick={() => prefixLine('### ')} title="Heading 3">H3</button>
          <button onClick={() => {
            const el = editorRef.current;
            if (!el) return;
            const start = el.selectionStart;
            const lineStart = md.lastIndexOf('\n', start - 1) + 1;
            const line = md.substring(lineStart);
            const cleaned = line.replace(/^(#{1,6}\s|>\s|- |\d+\.\s)/, '');
            const newText = md.substring(0, lineStart) + cleaned;
            setMd(newText);
            setTimeout(() => { el.focus(); el.selectionStart = el.selectionEnd = lineStart; }, 0);
          }} title="Plain text">T</button>
          <span className="tb-sep" style={{ background: editorTheme.edBorder || '#444' }} />
          <button onClick={() => wrapSelection('**', '**')} title="Bold"><b>B</b></button>
          <button onClick={() => wrapSelection('*', '*')} title="Italic"><i>I</i></button>
          <button onClick={() => wrapSelection('~~', '~~')} title="Strikethrough"><s>S</s></button>
          <button onClick={() => wrapSelection('`', '`')} title="Inline code">&lt;/&gt;</button>
          <span className="tb-sep" style={{ background: editorTheme.edBorder || '#444' }} />
          <button onClick={() => prefixLine('> ')} title="Quote">"</button>
          <button onClick={() => prefixLine('- ')} title="List">–</button>
          <button onClick={() => wrapSelection('\n```\n', '\n```\n')} title="Code block">{'{ }'}</button>
          <span className="tb-sep" style={{ background: editorTheme.edBorder || '#444' }} />
          <button onClick={() => wrapSelection('[', '](url)')} title="Link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 13, height: 13 }}>
              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
            </svg>
          </button>
          <button onClick={() => wrapSelection('![alt](', ')')} title="Image">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 13, height: 13 }}>
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
            </svg>
          </button>
          <button onClick={() => prefixLine('---\n')} title="Horizontal rule">―</button>
          <span className="tb-sep" style={{ background: editorTheme.edBorder || '#444' }} />
          <button onClick={() => {
            const el = editorRef.current;
            if (!el) return;
            const pos = el.selectionStart;
            setMd(md.substring(0, pos) + '\n<br>\n' + md.substring(pos));
            setTimeout(() => { el.focus(); el.selectionStart = el.selectionEnd = pos + 5; }, 0);
          }} title="빈 줄 삽입" style={{ fontSize: 10, letterSpacing: -0.5 }}>br</button>
        </div>}
        <div className={`search-bar ${searchVisible ? 'visible' : ''}`}
          style={{
            background: editorTheme.edHeaderBg || '#252526',
            borderColor: editorTheme.edBorder || '#333',
            '--sb-input-bg': editorTheme.edBg || '#1e1e1e',
            '--sb-input-color': editorTheme.edColor || '#d4d4d4',
            '--sb-input-border': editorTheme.edBorder || '#555',
            '--sb-btn-bg': editorTheme.edBg || '#3c3c3c',
            '--sb-btn-color': editorTheme.edColor || '#ccc',
            '--sb-label-color': editorTheme.edHeaderColor || '#888',
          }}>

          <input
            type="text" placeholder="Search..." value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={onSearchKeyDown}
          />
          <button onClick={findPrev} title="Previous" style={{ width: 26, height: 26, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&lsaquo;</button>
          <button onClick={findNext} title="Next" style={{ width: 26, height: 26, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&rsaquo;</button>
          <span className="search-match-info">
            {matches.length > 0 && currentMatch >= 0
              ? `${currentMatch + 1}/${matches.length}`
              : matches.length > 0 ? `${matches.length} found` : ''}
          </span>
          <button className="close-search" onClick={() => { setSearchVisible(false); setReplaceVisible(false); setSearchQuery(''); }}>&times;</button>
        </div>
        {replaceVisible && <div className="search-bar visible"
          style={{
            background: editorTheme.edHeaderBg || '#252526',
            borderColor: editorTheme.edBorder || '#333',
            '--sb-input-bg': editorTheme.edBg || '#1e1e1e',
            '--sb-input-color': editorTheme.edColor || '#d4d4d4',
            '--sb-input-border': editorTheme.edBorder || '#555',
            '--sb-btn-bg': editorTheme.edBg || '#3c3c3c',
            '--sb-btn-color': editorTheme.edColor || '#ccc',
            '--sb-label-color': editorTheme.edHeaderColor || '#888',
          }}>
          <input
            type="text" placeholder="Find..." value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <span className="search-label">&rarr;</span>
          <input
            type="text" placeholder="Replace..." value={replaceQuery}
            onChange={e => setReplaceQuery(e.target.value)}
          />
          <button onClick={replaceCurrent} style={{ opacity: 0.6, fontSize: 11 }}>Replace</button>
          <button onClick={replaceAll} style={{ opacity: 0.6, fontSize: 11 }}>All</button>
          <button className="close-search" onClick={() => { setReplaceVisible(false); setSearchQuery(''); setReplaceQuery(''); }}>&times;</button>
        </div>}
        <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
          {!md && <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
            gap: 24, pointerEvents: 'none', color: editorTheme.edHeaderColor || '#888',
            opacity: 0.7,
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 28, height: 28 }}>
                <path d="M17 3a2.85 2.85 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
              </svg>
              <span style={{ fontSize: 12 }}>Start writing</span>
            </div>
            <span style={{ opacity: 0.5, fontSize: 12 }}>or</span>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 28, height: 28 }}>
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><polyline points="9 15 12 12 15 15"/>
              </svg>
              <span style={{ fontSize: 12 }}>Drop .md file</span>
            </div>
          </div>}
          <textarea
            ref={editorRef}
            spellCheck={false}
            value={md}
            onChange={e => setMd(e.target.value)}
            onScroll={onEditorScroll}
            onKeyDown={onEditorKeyDown}
            onPaste={(e) => {
              const items = e.clipboardData?.items;
              if (!items) return;
              for (let i = 0; i < items.length; i++) {
                if (items[i].type.startsWith('image/')) {
                  e.preventDefault();
                  const file = items[i].getAsFile();
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    const imgMd = `![image](${ev.target.result})`;
                    const el = editorRef.current;
                    const pos = el ? el.selectionStart : 0;
                    setMd(prev => prev.substring(0, pos) + '\n' + imgMd + '\n' + prev.substring(pos));
                  };
                  reader.readAsDataURL(file);
                  break;
                }
              }
            }}
            style={{
              background: md ? (editorTheme.edBg || '#1e1e1e') : 'transparent',
              color: editorTheme.edColor || '#d4d4d4',
              caretColor: editorTheme.edCaret || '#aeafad',
              position: 'absolute', inset: 0, width: '100%', height: '100%',
            }}
          />
        </div>
        {savedVisible && <span style={{
          position: 'absolute', bottom: 12, right: 16,
          fontSize: 12, color: editorTheme.edColor || '#d4d4d4', opacity: 0.7,
          userSelect: 'none', pointerEvents: 'none',
        }}>[ Saved ]</span>}
        {actionToast && <span style={{
          position: 'absolute', bottom: 12, right: 16,
          fontSize: 12, color: editorTheme.edColor || '#d4d4d4', opacity: 0.7,
          userSelect: 'none', pointerEvents: 'none',
        }}>[ {actionToast} ]</span>}
      </div>

      <div ref={dropCursorRef} style={{
        display: 'none', position: 'fixed', height: 2,
        background: editorTheme.edCaret || '#aeafad', borderRadius: 1,
        pointerEvents: 'none', zIndex: 9999,
        opacity: 0.8,
      }} />

      <div className="divider" ref={dividerRef} style={{ background: editorTheme.edBorder || '#333' }}
        onMouseDown={(e) => {
          isDragging.current = true;
          document.body.style.cursor = 'col-resize';
          document.body.style.userSelect = 'none';
          e.preventDefault();
        }}
      >
        <span className="divider-dot" ref={dividerDotRef} />
      </div>

      <div className="pane preview-pane" style={{ width: (100 - paneRatio) + '%', background: theme.bg }}>
        <div className="preview-header" style={{
          background: theme.edHeaderBg || '#f0f0f0',
          borderColor: theme.edBorder || '#e0e0e0',
          color: theme.edHeaderColor || '#666',
        }}>
          <a className="label" href="https://github.com/ecsimsw/mdnote" target="_blank" rel="noopener noreferrer"
            style={{ fontWeight: 700, marginRight: 8, textDecoration: 'none', color: 'inherit', cursor: 'pointer', userSelect: 'none' }}>PdfViewer</a>
          <div className="header-controls">
            <button className="ctrl-btn" ref={fontBtnRef}
              onClick={() => setFontMenuVisible(v => !v)} title="Font"
              style={{ fontSize: 13, fontFamily: 'serif' }}>F</button>
            <div className="ctrl-sep" />
            <button className="ctrl-btn"
              onMouseDown={() => startHold(() => setFontSize(f => Math.max(8, f - 1)))}
              onMouseUp={stopHold} onMouseLeave={stopHold}>A&minus;</button>
            <button className="ctrl-btn"
              onMouseDown={() => startHold(() => setFontSize(f => Math.min(100, f + 1)))}
              onMouseUp={stopHold} onMouseLeave={stopHold}>A+</button>
            <div className="ctrl-sep" />
            <button className="ctrl-btn"
              onMouseDown={() => startHold(() => setLineHeight(h => Math.max(1.2, +(h - 0.1).toFixed(1))))}
              onMouseUp={stopHold} onMouseLeave={stopHold}>
              <svg viewBox="0 0 14 14" fill="currentColor"><rect x="1" y="2" width="12" height="1.5"/><rect x="1" y="6.5" width="12" height="1.5"/><rect x="1" y="11" width="12" height="1.5"/></svg>
            </button>
            <button className="ctrl-btn"
              onMouseDown={() => startHold(() => setLineHeight(h => Math.min(3, +(h + 0.1).toFixed(1))))}
              onMouseUp={stopHold} onMouseLeave={stopHold}>
              <svg viewBox="0 0 14 14" fill="currentColor"><rect x="1" y="1" width="12" height="1.5"/><rect x="1" y="6.25" width="12" height="1.5"/><rect x="1" y="11.5" width="12" height="1.5"/></svg>
            </button>
            <div className="ctrl-sep" />
            <button className="ctrl-btn" title="Narrower"
              onMouseDown={() => startHold(() => setMaxWidth(w => Math.max(40, w - 5)))}
              onMouseUp={stopHold} onMouseLeave={stopHold}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}>
                <path d="M18 12H6"/><path d="M14 8l4 4-4 4"/><path d="M10 8l-4 4 4 4"/>
              </svg>
            </button>
            <button className="ctrl-btn" title="Wider"
              onMouseDown={() => startHold(() => setMaxWidth(w => Math.min(100, w + 5)))}
              onMouseUp={stopHold} onMouseLeave={stopHold}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}>
                <path d="M18 12H6"/><path d="M8 8l-4 4 4 4"/><path d="M16 8l4 4-4 4"/>
              </svg>
            </button>
            <div className="ctrl-sep" />
            <button className="ctrl-btn" title="Move up"
              onMouseDown={() => startHold(() => setTopPadding(p => Math.max(0, p - 10)))}
              onMouseUp={stopHold} onMouseLeave={stopHold}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 14, height: 14 }}>
                <path d="M12 19V5"/><path d="M5 12l7-7 7 7"/>
              </svg>
            </button>
            <button className="ctrl-btn" title="Move down"
              onMouseDown={() => startHold(() => setTopPadding(p => Math.min(500, p + 10)))}
              onMouseUp={stopHold} onMouseLeave={stopHold}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 14, height: 14 }}>
                <path d="M12 5v14"/><path d="M5 12l7 7 7-7"/>
              </svg>
            </button>
            <div className="ctrl-sep" />
            <button className="ctrl-btn" ref={listBtnRef}
              onClick={() => setListMenuVisible(v => !v)}
              title="List style" style={{ minWidth: 24, justifyContent: 'center' }}>
              {LIST_STYLES[listStyle].label}
            </button>
            <div className="ctrl-sep" />
            <button className="ctrl-btn" ref={themeBtnRef}
              onClick={() => setThemeMenuVisible(v => !v)} title="Theme">
              <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 14, height: 14 }}>
                <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-1 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
              </svg>
            </button>
            <div className="ctrl-sep" />
            <button
              className="ctrl-btn"
              ref={pdfZoomBtnRef}
              onClick={() => { setPdfZoomMenuVisible(v => !v); setPdfZoomInput(String(pdfZoom)); }}
              title="PDF 비율"
              style={{ fontSize: 11, fontWeight: 500, minWidth: 32 }}
            >
              {pdfZoom}%
            </button>
            <button className="ctrl-btn" onClick={() => {
              const docTitle = currentDocId && docs.find(d => d.id === currentDocId)?.title;
              const prev = document.title;
              if (docTitle) document.title = docTitle;
              window.print();
              document.title = prev;
            }} title="Save as PDF">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}>
                <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
              </svg>
            </button>
          </div>
        </div>
        <div className="preview-content" ref={previewRef} style={{ background: theme.bg, '--print-bg': theme.bg }}>
          <article
            ref={contentRef}
            style={{
              zoom: fontSize / 15.5,
              '--print-zoom': (fontSize / 15.5) * (pdfZoom / 100),
              lineHeight: lineHeight,
              '--spacing': lineHeight / 1.6,
              '--list-style': LIST_STYLES[listStyle].type,
              maxWidth: maxWidth + '%',
              margin: '0 auto',
              paddingTop: topPadding + 'px',
              fontFamily: (FONTS.find(f => f.name === fontFamily) || FONTS[0]).value,
            }}
          />
        </div>
      </div>

      <div
        className={`list-menu ${docMenuVisible ? 'visible' : ''}`}
        ref={docMenuRef}
        style={docMenuVisible && docBtnRef.current ? (() => {
          const rect = docBtnRef.current.getBoundingClientRect();
          return { top: rect.bottom + 4, left: rect.left, minWidth: 200, maxHeight: 360, overflowY: 'auto' };
        })() : {}}
      >
        {newDocInputVisible ? (
          <div className="list-option" style={{ padding: '4px 8px', gap: 4, display: 'flex', alignItems: 'center' }}>
            <input
              ref={newDocInputRef}
              type="text"
              value={newDocTitle}
              onChange={e => setNewDocTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') confirmNewDoc(); if (e.key === 'Escape') setNewDocInputVisible(false); }}
              onClick={e => e.stopPropagation()}
              style={{
                flex: 1, background: 'transparent', border: '1px solid #ddd', borderRadius: 4,
                color: 'inherit', fontSize: 12, padding: '3px 6px', outline: 'none', minWidth: 0,
              }}
            />
          </div>
        ) : (
          <button className="list-option" onClick={e => { e.stopPropagation(); openNewDocInput(); }}
            style={{ fontWeight: 600, opacity: 0.7, fontSize: 12 }}>
            새 문서
          </button>
        )}
        <div style={{ height: 1, background: 'rgba(128,128,128,0.2)', margin: '4px 0' }} />
        {docs.length === 0 && (
          <div style={{ padding: '8px 12px', fontSize: 12, opacity: 0.4 }}>저장된 문서가 없습니다</div>
        )}
        {docs.map(d => (
          renamingDocId === d.id ? (
            <div key={d.id} className="list-option active" style={{ padding: '4px 8px', gap: 4, display: 'flex', alignItems: 'center' }}>
              <input
                ref={renameInputRef}
                type="text"
                value={renamingTitle}
                onChange={e => setRenamingTitle(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') confirmRename(); if (e.key === 'Escape') setRenamingDocId(null); }}
                onClick={e => e.stopPropagation()}
                style={{
                  flex: 1, background: 'transparent', border: '1px solid #ddd', borderRadius: 4,
                  color: 'inherit', fontSize: 12, padding: '3px 6px', outline: 'none', minWidth: 0,
                }}
              />
            </div>
          ) : (
            <button
              key={d.id}
              className={`list-option ${currentDocId === d.id ? 'active' : ''}`}
              onClick={() => loadDoc(d)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, textAlign: 'left' }}>{d.title}</span>
              <span onClick={(e) => startRename(d, e)}
                style={{ fontSize: 10, opacity: 0.3, flexShrink: 0, padding: '0 2px' }}
                onMouseEnter={e => e.target.style.opacity = 0.8}
                onMouseLeave={e => e.target.style.opacity = 0.3}
              >✎</span>
              <span onClick={(e) => deleteDoc(d.id, e)}
                style={{ fontSize: 11, opacity: 0.3, flexShrink: 0, padding: '0 2px' }}
                onMouseEnter={e => e.target.style.opacity = 0.8}
                onMouseLeave={e => e.target.style.opacity = 0.3}
              >✕</span>
            </button>
          )
        ))}
      </div>

      <div
        className={`theme-menu ${themeMenuVisible ? 'visible' : ''}`}
        ref={themeMenuRef}
        style={themeMenuStyle}
      >
        {THEMES.map(t => (
          <button
            key={t.name}
            className={`theme-swatch ${theme.cls === t.cls ? 'active' : ''}`}
            onClick={() => { setTheme(t); setThemeMenuVisible(false); }}
          >
            <span className="theme-dot" style={{ background: t.bg }} />
            {t.name}
          </button>
        ))}
      </div>

      <div
        className={`list-menu ${pdfZoomMenuVisible ? 'visible' : ''}`}
        ref={pdfZoomMenuRef}
        style={pdfZoomMenuVisible && pdfZoomBtnRef.current ? (() => {
          const rect = pdfZoomBtnRef.current.getBoundingClientRect();
          return { top: rect.bottom + 4, right: window.innerWidth - rect.right };
        })() : {}}
      >
        {[50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100].map(v => (
          <button
            key={v}
            className={`list-option ${pdfZoom === v ? 'active' : ''}`}
            onClick={() => { setPdfZoom(v); setPdfZoomInput(String(v)); setPdfZoomMenuVisible(false); }}
          >
            {v}%
          </button>
        ))}
        <div className={`list-option ${![50,55,60,65,70,75,80,85,90,95,100].includes(pdfZoom) ? 'active' : ''}`}
          style={{ padding: '4px 8px', gap: 4 }}>
          <input
            type="text"
            inputMode="numeric"
            value={pdfZoomInput}
            onChange={e => setPdfZoomInput(e.target.value.replace(/\D/g, ''))}
            onBlur={() => { const v = Number(pdfZoomInput); if (v > 0 && v <= 200) setPdfZoom(v); else setPdfZoomInput(String(pdfZoom)); }}
            onKeyDown={e => { if (e.key === 'Enter') { e.target.blur(); } }}
            onFocus={e => e.target.select()}
            onMouseDown={e => e.stopPropagation()}
            style={{
              width: 48, textAlign: 'center', background: 'transparent',
              border: '1px solid #ddd', borderRadius: 4, color: 'inherit',
              fontSize: 13, padding: '2px 4px', outline: 'none', userSelect: 'text',
            }}
          />
          <span style={{ fontSize: 12, opacity: 0.5 }}>%</span>
        </div>
      </div>

      <div
        className={`list-menu ${listMenuVisible ? 'visible' : ''}`}
        ref={listMenuRef}
        style={listMenuVisible && listBtnRef.current ? (() => {
          const rect = listBtnRef.current.getBoundingClientRect();
          return { top: rect.bottom + 4, right: window.innerWidth - rect.right };
        })() : {}}
      >
        {LIST_STYLES.map((s, i) => (
          s.custom ? (
            <div key="custom" className={`list-option ${listStyle === i ? 'active' : ''}`}
              style={{ padding: '4px 8px', gap: 4 }}>
              <input
                type="text"
                value={customListChar}
                onChange={e => { setCustomListChar(e.target.value); setListStyle(i); }}
                onClick={e => e.stopPropagation()}
                style={{
                  width: 32, textAlign: 'center', background: 'transparent',
                  border: '1px solid #ddd', borderRadius: 4, color: 'inherit',
                  fontSize: 13, padding: '2px 4px', outline: 'none', fontFamily: 'inherit',
                }}
                maxLength={3}
              />
            </div>
          ) : (
            <button
              key={s.label}
              className={`list-option ${listStyle === i ? 'active' : ''}`}
              onClick={() => { setListStyle(i); setListMenuVisible(false); }}
            >
              {s.label}
            </button>
          )
        ))}
      </div>

      <div
        className={`theme-menu ${editorThemeMenuVisible ? 'visible' : ''}`}
        ref={editorThemeMenuRef}
        style={editorThemeMenuVisible && editorThemeBtnRef.current ? (() => {
          const rect = editorThemeBtnRef.current.getBoundingClientRect();
          return { top: rect.bottom + 4, left: rect.left };
        })() : {}}
      >
        {THEMES.map(t => (
          <button
            key={t.name}
            className={`theme-swatch ${editorTheme.cls === t.cls ? 'active' : ''}`}
            onClick={() => { setEditorTheme(t); setEditorThemeMenuVisible(false); }}
          >
            <span className="theme-dot" style={{ background: t.edBg || t.bg }} />
            {t.name}
          </button>
        ))}
      </div>

      <div
        className={`list-menu ${fontMenuVisible ? 'visible' : ''}`}
        ref={fontMenuRef}
        style={fontMenuVisible && fontBtnRef.current ? (() => {
          const rect = fontBtnRef.current.getBoundingClientRect();
          return { top: rect.bottom + 4, right: window.innerWidth - rect.right };
        })() : {}}
      >
        {['한', 'E'].map(lang => {
          const fonts = FONTS.filter(f => f.lang === lang);
          return [
            <div key={`label-${lang}`} style={{
              fontSize: 10, color: '#aaa', padding: '10px 14px 2px',
              letterSpacing: 1, textTransform: 'uppercase',
            }}>{lang === '한' ? 'kor' : 'eng'}</div>,
            ...fonts.map(f => (
              <button
                key={f.name}
                className={`list-option ${fontFamily === f.name ? 'active' : ''}`}
                style={{ fontFamily: f.value, fontSize: 13 }}
                onClick={() => { setFontFamily(f.name); setFontMenuVisible(false); }}
              >
                {f.name}
              </button>
            ))
          ];
        })}
      </div>


    </div>
  );
}

export default App;
