import { useEffect } from 'react';

export default function ErrorToast({ message, onClose }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, 6000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      zIndex: 99999, maxWidth: '90vw', width: 420,
    }}>
      <div style={{
        background: '#fee', border: '1px solid #fcc', borderRadius: 8,
        padding: '12px 16px', boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
        display: 'flex', gap: 10, alignItems: 'flex-start',
      }}>
        <span style={{ color: '#c00', fontSize: 14, flexShrink: 0, marginTop: 1 }}>⚠</span>
        <pre style={{
          flex: 1, fontSize: 12, color: '#600', lineHeight: 1.5,
          margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit',
        }}>{message}</pre>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', color: '#c00', cursor: 'pointer',
          fontSize: 16, padding: 0, flexShrink: 0, lineHeight: 1,
        }}>×</button>
      </div>
    </div>
  );
}
