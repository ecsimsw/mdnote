import { useState } from 'react';

export default function SaveModal({ remoteInfo, onSave, onCancel }) {
  const [commitMsg, setCommitMsg] = useState('');
  const isGithub = remoteInfo?.source === 'github';
  const isS3 = remoteInfo?.source === 's3';

  const handleSave = () => {
    if (isGithub && !commitMsg.trim()) return;
    onSave(commitMsg.trim());
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onCancel}>
      <div style={{
        background: '#fff', borderRadius: 10, padding: 20,
        width: 360, maxWidth: '90vw',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#222' }}>
          {isGithub ? 'GitHub에 커밋' : 'S3에 업로드'}
        </div>
        <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
          {remoteInfo?.path}
        </div>
        {isGithub && (
          <input
            type="text"
            placeholder="커밋 메시지를 입력하세요"
            value={commitMsg}
            onChange={e => setCommitMsg(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            autoFocus
            style={{
              width: '100%', padding: '8px 10px', border: '1px solid #ddd',
              borderRadius: 6, fontSize: 13, outline: 'none', fontFamily: 'inherit',
              marginBottom: 12, boxSizing: 'border-box',
            }}
          />
        )}
        {isS3 && (
          <div style={{ fontSize: 12, color: '#666', marginBottom: 12, lineHeight: 1.5 }}>
            <b>{remoteInfo.bucket}</b> 버킷의 파일을 덮어씁니다.
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{
            padding: '6px 14px', border: '1px solid #ddd', borderRadius: 6,
            background: '#fff', color: '#666', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
          }}>취소</button>
          <button onClick={handleSave} style={{
            padding: '6px 14px', border: 'none', borderRadius: 6,
            background: isGithub ? '#24292e' : '#f90', color: '#fff',
            fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            {isGithub ? '커밋' : '업로드'}
          </button>
        </div>
      </div>
    </div>
  );
}
