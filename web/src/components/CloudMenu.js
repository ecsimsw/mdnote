import { useState, useRef, useEffect } from 'react';
import { loadSetting, saveSetting } from '../hooks/useStorage';
import * as github from '../services/github';
import * as s3 from '../services/s3';

// connections = [
//   { type: 'github', token, login, repo, branch },
//   { type: 's3', accessKey, secretKey, region, bucket },
// ]

const LOCAL_CONNECTION = { type: 'local' };

export default function CloudMenu({ editorTheme, activeConnection, onSelectConnection, onError }) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [step, setStep] = useState('main'); // 'main' | 'add-select' | 'add-gh-token' | 'add-auth' | 'add-repos'
  const [addType, setAddType] = useState(null);
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  const [connections, setConnections] = useState(() => loadSetting('cloudConnections', []));

  // GitHub add flow
  const [ghNewToken, setGhNewToken] = useState('');
  const [ghActiveToken, setGhActiveToken] = useState(null);
  const [ghUser, setGhUser] = useState(null);
  const [ghRepos, setGhRepos] = useState([]);
  const [repoSearch, setRepoSearch] = useState('');

  // S3 add flow
  const [s3AccessKey, setS3AccessKey] = useState(() => loadSetting('s3AccessKey', ''));
  const [s3SecretKey, setS3SecretKey] = useState(() => loadSetting('s3SecretKey', ''));
  const [s3Region, setS3Region] = useState(() => loadSetting('s3Region', 'us-east-1'));
  const [s3Buckets, setS3Buckets] = useState([]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      if (!document.contains(e.target)) return;
      if (menuRef.current && !menuRef.current.contains(e.target) &&
          btnRef.current && !btnRef.current.contains(e.target)) {
        setMenuVisible(false);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const resetAdd = () => {
    setAddType(null);
    setGhNewToken('');
    setGhActiveToken(null);
    setGhUser(null);
    setGhRepos([]);
    setRepoSearch('');
    setS3Buckets([]);
  };

  const goMain = () => {
    setStep('main');
    resetAdd();
  };

  const saveConnection = (conn) => {
    const exists = connections.some(c => {
      if (c.type === 'github' && conn.type === 'github') return c.repo === conn.repo;
      if (c.type === 's3' && conn.type === 's3') return c.bucket === conn.bucket;
      return false;
    });
    if (exists) return;
    const updated = [...connections, conn];
    setConnections(updated);
    saveSetting('cloudConnections', updated);
  };

  const removeConnection = (idx) => {
    const removed = connections[idx];
    const updated = connections.filter((_, i) => i !== idx);
    setConnections(updated);
    saveSetting('cloudConnections', updated);
    // 삭제된 게 현재 선택된 연결이면 Local로 전환
    if (activeConnection && isEqual(activeConnection, removed)) {
      onSelectConnection(LOCAL_CONNECTION);
    }
  };

  const isEqual = (a, b) => {
    if (!a || !b) return false;
    if (a.type !== b.type) return false;
    if (a.type === 'local') return true;
    if (a.type === 'github') return a.repo === b.repo;
    if (a.type === 's3') return a.bucket === b.bucket;
    return false;
  };

  const isActive = (conn) => isEqual(activeConnection, conn);

  // --- GitHub ---
  const addNewToken = async () => {
    const token = ghNewToken.trim();
    if (!token) { onError('토큰을 입력해주세요.'); return; }
    setLoading(true);
    try {
      const user = await github.validateToken(token);
      setGhUser(user);
      setGhActiveToken(token);
      const repos = await github.listRepos(token);
      setGhRepos(repos);
      setRepoSearch('');
      setStep('add-repos');
    } catch (err) {
      onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectGhRepo = (repo) => {
    const conn = {
      type: 'github',
      token: ghActiveToken,
      login: ghUser?.login || '',
      repo: repo.name,
      branch: repo.default_branch,
    };
    saveConnection(conn);
    onSelectConnection(conn);
    goMain();
    setMenuVisible(false);
  };

  // --- S3 ---
  const connectS3 = async () => {
    if (!s3AccessKey.trim() || !s3SecretKey.trim()) { onError('Access Key와 Secret Key를 입력해주세요.'); return; }
    setLoading(true);
    try {
      const buckets = await s3.listBuckets(s3AccessKey.trim(), s3SecretKey.trim(), s3Region.trim());
      setS3Buckets(buckets);
      saveSetting('s3AccessKey', s3AccessKey.trim());
      saveSetting('s3SecretKey', s3SecretKey.trim());
      saveSetting('s3Region', s3Region.trim());
      setStep('add-repos');
    } catch (err) {
      onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectS3Bucket = (bucket) => {
    const conn = {
      type: 's3',
      accessKey: s3AccessKey.trim(),
      secretKey: s3SecretKey.trim(),
      region: s3Region.trim(),
      bucket: bucket.name,
    };
    saveConnection(conn);
    onSelectConnection(conn);
    goMain();
    setMenuVisible(false);
  };

  // --- 레포 그룹화 ---
  const filteredRepos = repoSearch
    ? ghRepos.filter(r => r.name.toLowerCase().includes(repoSearch.toLowerCase()))
    : ghRepos;

  const groupedRepos = (() => {
    const myLogin = ghUser?.login?.toLowerCase() || '';
    const groups = {};
    filteredRepos.forEach(r => {
      const [owner, repo] = r.name.split('/');
      if (!groups[owner]) groups[owner] = [];
      groups[owner].push({ ...r, repoName: repo });
    });
    const owners = Object.keys(groups).sort((a, b) => {
      if (a.toLowerCase() === myLogin) return -1;
      if (b.toLowerCase() === myLogin) return 1;
      return a.localeCompare(b);
    });
    owners.forEach(o => groups[o].sort((a, b) => a.repoName.localeCompare(b.repoName)));
    return { owners, groups };
  })();

  const inputStyle = {
    width: '100%', background: 'transparent',
    border: '1px solid rgba(128,128,128,0.3)', borderRadius: 4,
    color: 'inherit', fontSize: 12, padding: '6px 8px', outline: 'none',
    fontFamily: 'inherit',
  };

  const primaryBtnStyle = {
    width: '100%', padding: '7px 0', border: 'none', borderRadius: 4,
    background: 'rgba(0,122,255,0.85)', color: '#fff', fontSize: 12,
    cursor: 'pointer', fontFamily: 'inherit',
  };

  const connLabel = (c) => {
    if (c.type === 'local') return 'Local';
    if (c.type === 'github') return c.repo.split('/').pop();
    return c.bucket;
  };

  const connSublabel = (c) => {
    if (c.type === 'github') return c.login;
    if (c.type === 's3') return c.region;
    return null;
  };

  const connIcon = (c) => {
    if (c.type === 'local') return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 13, height: 13, flexShrink: 0, opacity: 0.5 }}>
        <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
      </svg>
    );
    if (c.type === 'github') return (
      <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 13, height: 13, flexShrink: 0, opacity: 0.5 }}>
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
      </svg>
    );
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 13, height: 13, flexShrink: 0, opacity: 0.5 }}>
        <path d="M22 12l-10 7V5l10 7zM2 12l10-7v14L2 12z" opacity="0.8"/>
      </svg>
    );
  };

  const allConnections = [LOCAL_CONNECTION, ...connections];

  return (
    <>
      <button className="ctrl-btn" ref={btnRef}
        onClick={() => { setMenuVisible(v => !v); if (!menuVisible) goMain(); }}
        title="클라우드 연결"
        style={{ color: editorTheme.edHeaderColor || '#ccc' }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}>
          <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"/>
        </svg>
      </button>

      <div className={`list-menu ${menuVisible ? 'visible' : ''}`} ref={menuRef}
        style={menuVisible && btnRef.current ? (() => {
          const rect = btnRef.current.getBoundingClientRect();
          return { top: rect.bottom + 4, left: rect.left, minWidth: 220, maxHeight: 420, overflowY: 'auto' };
        })() : {}}>

        {/* Back */}
        {step !== 'main' && (
          <button className="list-option" onClick={() => {
            if (step === 'add-repos' && addType === 'github') { setStep('add-gh-token'); setGhRepos([]); setRepoSearch(''); }
            else if (step === 'add-repos' && addType === 's3') { setStep('add-auth'); setS3Buckets([]); }
            else if (step === 'add-gh-token') { setStep('add-select'); resetAdd(); }
            else if (step === 'add-auth') { setStep('add-select'); resetAdd(); }
            else if (step === 'add-select') goMain();
            else goMain();
          }} style={{ fontSize: 11, opacity: 0.4, padding: '4px 10px' }}>
            ←
          </button>
        )}

        {/* === MAIN === */}
        {step === 'main' && (
          <div style={{ padding: 4 }}>
            {allConnections.map((c, idx) => (
              <div key={c.type === 'local' ? 'local' : idx} style={{ display: 'flex', alignItems: 'center' }}>
                <button className={`list-option ${isActive(c) ? 'active' : ''}`}
                  onClick={() => { onSelectConnection(c); setMenuVisible(false); }}
                  style={{ flex: 1, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {connIcon(c)}
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{connLabel(c)}</span>
                  {connSublabel(c) && <span style={{ fontSize: 10, opacity: 0.35, flexShrink: 0 }}>{connSublabel(c)}</span>}
                </button>
                {c.type !== 'local' && (
                  <span onClick={(e) => { e.stopPropagation(); removeConnection(idx - 1); }}
                    style={{ fontSize: 13, opacity: 0.3, padding: '4px 10px', cursor: 'pointer', flexShrink: 0 }}
                    onMouseEnter={e => e.target.style.opacity = 0.8}
                    onMouseLeave={e => e.target.style.opacity = 0.3}
                  >✕</span>
                )}
              </div>
            ))}
            <div style={{ height: 1, background: 'rgba(128,128,128,0.15)', margin: '4px 0' }} />
            <button className="list-option" onClick={() => setStep('add-select')}
              style={{ fontSize: 12, opacity: 0.6, justifyContent: 'center', width: '100%' }}>
              +
            </button>
          </div>
        )}

        {/* === ADD SELECT === */}
        {step === 'add-select' && (
          <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <button className="list-option" onClick={() => { setAddType('github'); setStep('add-gh-token'); }}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 16, height: 16, flexShrink: 0 }}>
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              GitHub
            </button>
            <button className="list-option" onClick={() => { setAddType('s3'); setStep('add-auth'); }}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 16, height: 16, flexShrink: 0 }}>
                <path d="M22 12l-10 7V5l10 7zM2 12l10-7v14L2 12z" opacity="0.8"/>
              </svg>
              Amazon S3
            </button>
          </div>
        )}

        {/* === GitHub 토큰 입력 === */}
        {step === 'add-gh-token' && (
          <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.7 }}>GitHub 토큰</div>
            <input id="cloud-gh-token" type="password" placeholder="ghp_xxxxxxxxxxxx"
              value={ghNewToken} onChange={e => setGhNewToken(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addNewToken()}
              autoFocus
              style={inputStyle} />
            <div style={{ fontSize: 10, opacity: 0.4, lineHeight: 1.4 }}>
              Settings → Developer settings → Personal access tokens → repo scope 필요
            </div>
            <button onClick={addNewToken} disabled={loading} style={primaryBtnStyle}>
              {loading ? '연결 중...' : '연결'}
            </button>
          </div>
        )}

        {/* === S3 인증 === */}
        {step === 'add-auth' && addType === 's3' && (
          <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.7 }}>AWS S3</div>
            <input id="cloud-s3-ak" type="text" placeholder="Access Key ID"
              value={s3AccessKey} onChange={e => setS3AccessKey(e.target.value)}
              autoFocus style={inputStyle} />
            <input id="cloud-s3-sk" type="password" placeholder="Secret Access Key"
              value={s3SecretKey} onChange={e => setS3SecretKey(e.target.value)}
              style={inputStyle} />
            <input id="cloud-s3-region" type="text" placeholder="Region (기본: us-east-1)"
              value={s3Region} onChange={e => setS3Region(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && connectS3()}
              style={inputStyle} />
            <button onClick={connectS3} disabled={loading} style={primaryBtnStyle}>
              {loading ? '연결 중...' : '연결'}
            </button>
          </div>
        )}

        {/* === GitHub 레포 선택 === */}
        {step === 'add-repos' && addType === 'github' && (
          <div>
            <div style={{ padding: '6px 10px 2px' }}>
              <input id="cloud-repo-search" type="text" placeholder="저장소 검색..."
                value={repoSearch} onChange={e => setRepoSearch(e.target.value)}
                autoFocus
                style={{ ...inputStyle, fontSize: 11, padding: '4px 6px' }} />
            </div>
            {filteredRepos.length === 0 && <div style={{ padding: 12, fontSize: 12, opacity: 0.4 }}>
              {repoSearch ? '검색 결과 없음' : '저장소가 없습니다'}
            </div>}
            {groupedRepos.owners.map((owner, idx) => (
              <div key={owner}>
                <div style={{ padding: '12px 12px 6px', fontSize: 11, opacity: 0.75, fontWeight: 700, borderBottom: '1px solid rgba(128,128,128,0.2)', marginTop: idx === 0 ? 2 : 12 }}>
                  {owner}
                </div>
                {groupedRepos.groups[owner].map(r => (
                  <button key={r.name} className="list-option" onClick={() => selectGhRepo(r)}
                    style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 16 }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.repoName}</span>
                  </button>
                ))}
              </div>
            ))}
            {loading && <div style={{ padding: 12, fontSize: 12, opacity: 0.5, textAlign: 'center' }}>로딩 중...</div>}
          </div>
        )}

        {/* === S3 버킷 선택 === */}
        {step === 'add-repos' && addType === 's3' && (
          <div>
            <div style={{ padding: '8px 12px', fontSize: 11, opacity: 0.5, borderBottom: '1px solid rgba(128,128,128,0.15)' }}>
              버킷 선택
            </div>
            {s3Buckets.length === 0 && <div style={{ padding: 12, fontSize: 12, opacity: 0.4 }}>버킷이 없습니다</div>}
            {s3Buckets.map(b => (
              <button key={b.name} className="list-option" onClick={() => selectS3Bucket(b)}
                style={{ fontSize: 12 }}>
                {b.name}
              </button>
            ))}
            {loading && <div style={{ padding: 12, fontSize: 12, opacity: 0.5, textAlign: 'center' }}>로딩 중...</div>}
          </div>
        )}
      </div>
    </>
  );
}
