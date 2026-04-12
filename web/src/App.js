import { useState, useRef, useEffect } from 'react';
import { marked } from 'marked';
import THEMES from './themes';
import './styles/editor.css';
import './styles/preview.css';
import './styles/themes.css';

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

function App() {
  const [md, setMd] = useState(SAMPLE_MD);
  const [theme, setTheme] = useState({ cls: '', bg: '#fff' });
  const [fontSize, setFontSize] = useState(15.5);
  const [lineHeight, setLineHeight] = useState(1.8);
  const [maxWidth, setMaxWidth] = useState(100);
  const [searchVisible, setSearchVisible] = useState(false);
  const [replaceVisible, setReplaceVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [matches, setMatches] = useState([]);
  const [currentMatch, setCurrentMatch] = useState(-1);
  const [themeMenuVisible, setThemeMenuVisible] = useState(false);
  const [editorTheme, setEditorTheme] = useState({ name: 'Dark', cls: 'dark', bg: '#1a1a1a', edBg: '#1e1e1e', edColor: '#d4d4d4', edHeaderBg: '#252526', edHeaderColor: '#ccc', edBorder: '#333', edCaret: '#aeafad' });
  const [editorThemeMenuVisible, setEditorThemeMenuVisible] = useState(false);
  const [listMenuVisible, setListMenuVisible] = useState(false);
  const [listStyle, setListStyle] = useState(0);
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
  ];
  const [paneRatio, setPaneRatio] = useState(50);

  const editorRef = useRef(null);
  const previewRef = useRef(null);
  const contentRef = useRef(null);
  const themeBtnRef = useRef(null);
  const themeMenuRef = useRef(null);
  const listBtnRef = useRef(null);
  const listMenuRef = useRef(null);
  const editorThemeBtnRef = useRef(null);
  const editorThemeMenuRef = useRef(null);
  const isDragging = useRef(false);

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
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

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
      <div className="pane editor-pane" style={{ width: paneRatio + '%', background: editorTheme.edBg || '#1e1e1e' }}>
        <div className="editor-header" style={{ background: editorTheme.edHeaderBg || '#252526', borderColor: editorTheme.edBorder || '#333' }}>
          <span className="file-name" style={{ color: editorTheme.edHeaderColor || '#ccc' }}>Editor</span>
          <div className="header-controls">
            <button className="ctrl-btn" onClick={() => setSearchVisible(v => {
              if (v) { setSearchQuery(''); }
              setReplaceVisible(false);
              return !v;
            })} title="Find"
              style={{ color: editorTheme.edHeaderColor || '#ccc' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}>
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
            </button>
            <div className="ctrl-sep" style={{ background: editorTheme.edBorder || '#444' }} />
            <button className="ctrl-btn" onClick={() => {
              setReplaceVisible(v => {
                if (v) { setSearchQuery(''); setReplaceQuery(''); }
                setSearchVisible(false);
                return !v;
              });
            }} title="Replace"
              style={{ color: editorTheme.edHeaderColor || '#ccc', fontWeight: 400, fontSize: 14 }}>
              R
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
          <span className="search-label">Find</span>
          <input
            type="text" placeholder="Search..." value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={onSearchKeyDown}
          />
          <button onClick={findPrev} title="Previous">&lsaquo;</button>
          <button onClick={findNext} title="Next">&rsaquo;</button>
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
          <button onClick={replaceCurrent}>Replace</button>
          <button onClick={replaceAll}>All</button>
          <button className="close-search" onClick={() => { setReplaceVisible(false); setSearchQuery(''); setReplaceQuery(''); }}>&times;</button>
        </div>}
        <textarea
          ref={editorRef}
          spellCheck={false}
          value={md}
          onChange={e => setMd(e.target.value)}
          onScroll={onEditorScroll}
          onKeyDown={onEditorKeyDown}
          style={{
            background: editorTheme.edBg || '#1e1e1e',
            color: editorTheme.edColor || '#d4d4d4',
            caretColor: editorTheme.edCaret || '#aeafad',
          }}
        />
      </div>

      <div className="divider" style={{ background: editorTheme.edBorder || '#333' }} onMouseDown={(e) => {
        isDragging.current = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        e.preventDefault();
      }} />

      <div className="pane preview-pane" style={{ width: (100 - paneRatio) + '%', background: theme.bg }}>
        <div className="preview-header">
          <span className="label">Preview</span>
          <div className="header-controls">
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
            <button className="ctrl-btn"
              onMouseDown={() => startHold(() => setMaxWidth(w => Math.max(40, w - 10)))}
              onMouseUp={stopHold} onMouseLeave={stopHold}>{'\u25BD'}</button>
            <span className="ctrl-btn" style={{ pointerEvents: 'none', color: '#aaa', fontSize: 11 }}>{Math.round(maxWidth)}%</span>
            <button className="ctrl-btn"
              onMouseDown={() => startHold(() => setMaxWidth(w => Math.min(100, w + 10)))}
              onMouseUp={stopHold} onMouseLeave={stopHold}>{'\u25B3'}</button>
            <div className="ctrl-sep" />
            <button className="ctrl-btn" ref={themeBtnRef}
              onClick={() => setThemeMenuVisible(v => !v)} title="Theme">
              <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 14, height: 14 }}>
                <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-1 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
              </svg>
            </button>
            <div className="ctrl-sep" />
            <button className="ctrl-btn" ref={listBtnRef}
              onClick={() => setListMenuVisible(v => !v)}
              title="List style" style={{ minWidth: 24, justifyContent: 'center' }}>
              {LIST_STYLES[listStyle].label}
            </button>
            <div className="ctrl-sep" />
            <button className="ctrl-btn" onClick={() => window.print()} title="PDF">PDF</button>
          </div>
        </div>
        <div className="preview-content" ref={previewRef} style={{ background: theme.bg, '--print-bg': theme.bg }}>
          <article
            ref={contentRef}
            style={{
              zoom: fontSize / 15.5,
              lineHeight: lineHeight,
              '--spacing': lineHeight / 1.8,
              '--list-style': LIST_STYLES[listStyle].type,
              maxWidth: maxWidth + '%',
              margin: '0 auto',
            }}
          />
        </div>
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
        className={`list-menu ${listMenuVisible ? 'visible' : ''}`}
        ref={listMenuRef}
        style={listMenuVisible && listBtnRef.current ? (() => {
          const rect = listBtnRef.current.getBoundingClientRect();
          return { top: rect.bottom + 4, right: window.innerWidth - rect.right };
        })() : {}}
      >
        {LIST_STYLES.map((s, i) => (
          <button
            key={s.label}
            className={`list-option ${listStyle === i ? 'active' : ''}`}
            onClick={() => { setListStyle(i); setListMenuVisible(false); }}
          >
            {s.label}
          </button>
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
    </div>
  );
}

export default App;
