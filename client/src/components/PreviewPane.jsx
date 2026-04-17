import React from 'react';

export default function PreviewPane({ html }) {
  if (!html) {
    return (
      <div className="preview-area" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--bh-text-muted)', fontSize: 14 }}>
          Upload a document to see preview
        </div>
      </div>
    );
  }

  return (
    <div className="preview-area">
      <iframe
        className="preview-frame"
        srcDoc={html}
        title="Document Preview"
        sandbox="allow-same-origin"
      />
    </div>
  );
}
