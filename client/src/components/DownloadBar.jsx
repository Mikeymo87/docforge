import React from 'react';

export default function DownloadBar({ state, onDownloadPdf, onReset, filename }) {
  const isRendering = state === 'rendering';
  const hasDoc = state === 'parsed' || state === 'rendering';

  return (
    <div className="download-bar">
      <button
        className="btn btn-pdf"
        onClick={onDownloadPdf}
        disabled={!hasDoc || isRendering}
      >
        {isRendering ? 'Rendering...' : 'Download PDF'}
      </button>
      <button
        className="btn btn-word"
        disabled
        title="Coming in Phase 3"
      >
        Download Word
      </button>
      {hasDoc && (
        <button className="btn btn-secondary" onClick={onReset}>
          New Document
        </button>
      )}
      <div className="download-status">
        {isRendering && 'Puppeteer is rendering your PDF...'}
        {filename && !isRendering && filename}
      </div>
    </div>
  );
}
