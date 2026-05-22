export function loadSetting(key, fallback) {
  try {
    const v = localStorage.getItem('mdeditor_' + key);
    return v !== null ? JSON.parse(v) : fallback;
  } catch { return fallback; }
}

export function saveSetting(key, value) {
  localStorage.setItem('mdeditor_' + key, JSON.stringify(value));
}
