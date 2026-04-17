import React from 'react';

export default function PreviewPane({ previewUrl, state }) {
  if (!previewUrl) {
    return (
      <div className="preview-area" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--bh-text-muted)', fontSize: 14 }}>
          Upload a document to see preview
        </div>
      </div>
    );
  }

  return (
    <div className="preview-area" style={{ position: 'relative' }}>
      {state === 'previewing' && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10, borderRadius: 4,
        }}>
          <div style={{ color: '#fff', fontSize: 13 }}>Updating preview...</div>
        </div>
      )}
      <iframe
        className="preview-frame"
        src={previewUrl}
        title="Document Preview"
      />
    </div>
  );
}
