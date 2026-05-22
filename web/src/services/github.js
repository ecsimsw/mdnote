const API = 'https://api.github.com';

function headers(token) {
  return {
    'Accept': 'application/vnd.github.v3+json',
    ...(token ? { 'Authorization': `token ${token}` } : {}),
  };
}

function handleError(res) {
  if (res.status === 401) throw new Error('토큰이 유효하지 않습니다. 다시 확인해주세요.');
  if (res.status === 403) {
    const rateLimitRemaining = res.headers.get('X-RateLimit-Remaining');
    if (rateLimitRemaining === '0') throw new Error('API 호출 한도를 초과했습니다. 잠시 후 다시 시도해주세요.');
    throw new Error('이 저장소에 접근 권한이 없습니다. 토큰의 repo scope를 확인해주세요.');
  }
  if (res.status === 404) throw new Error('저장소를 찾을 수 없거나 접근 권한이 없습니다.');
  if (!res.ok) throw new Error(`GitHub API 오류 (${res.status})`);
}

export async function validateToken(token) {
  const res = await fetch(`${API}/user`, { headers: headers(token) });
  handleError(res);
  return await res.json();
}

export async function listRepos(token) {
  const repos = [];
  let page = 1;
  while (true) {
    const res = await fetch(`${API}/user/repos?per_page=100&page=${page}&sort=updated`, { headers: headers(token) });
    handleError(res);
    const data = await res.json();
    if (data.length === 0) break;
    repos.push(...data);
    if (data.length < 100) break;
    page++;
  }
  return repos.map(r => ({ name: r.full_name, private: r.private, default_branch: r.default_branch }));
}

export async function listMdFiles(token, repo, branch) {
  const res = await fetch(`${API}/repos/${repo}/git/trees/${branch}?recursive=1`, { headers: headers(token) });
  handleError(res);
  const data = await res.json();
  return (data.tree || [])
    .filter(f => f.type === 'blob' && /\.md$/i.test(f.path))
    .map(f => ({ path: f.path, sha: f.sha }));
}

export async function getFileContent(token, repo, path) {
  const res = await fetch(`${API}/repos/${repo}/contents/${encodeURIComponent(path)}`, { headers: headers(token) });
  handleError(res);
  const data = await res.json();
  return { content: atob(data.content), sha: data.sha };
}

export async function commitFile(token, repo, path, content, message, sha) {
  const res = await fetch(`${API}/repos/${repo}/contents/${encodeURIComponent(path)}`, {
    method: 'PUT',
    headers: { ...headers(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      content: btoa(unescape(encodeURIComponent(content))),
      sha,
    }),
  });
  handleError(res);
  return await res.json();
}
