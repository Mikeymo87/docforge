import React from 'react';
import { useDocForge } from './hooks/useDocForge';
import UploadZone from './components/UploadZone';
import OptionsPanel from './components/OptionsPanel';
import PreviewPane from './components/PreviewPane';
import DownloadBar from './components/DownloadBar';

export default function App() {
  const {
    state, doc, filename, options, previewHtml, error,
    upload, mergeUpload, pasteText, updateOptions, downloadPdf, reset,
  } = useDocForge();

  const hasDoc = doc !== null;

  return (
    <>
      {/* Top Bar */}
      <div className="topbar">
        <svg className="topbar-logo" viewBox="0 0 24 24" width="28" height="28">
          <circle cx="12" cy="12" r="11" fill="#2EA84A" />
          <text x="12" y="16" textAnchor="middle" fill="white" fontSize="11" fontWeight="800" fontFamily="DM Sans, Arial">DF</text>
        </svg>
        <span className="topbar-title">DocForge</span>
        <span className="topbar-subtitle">Baptist Health</span>
        {filename && <span className="topbar-file">{filename}</span>}
      </div>

      {/* Error Banner */}
      {error && (
        <div style={{
          background: '#E5554F', color: 'white', padding: '10px 24px',
          fontSize: 13, fontWeight: 600
        }}>
          {error}
        </div>
      )}

      {/* Loading Overlay */}
      {state === 'uploading' && (
        <div className="loading-overlay">
          <div className="loading-card">
            <div className="spinner" />
            <div style={{ color: 'var(--bh-text)', fontSize: 14 }}>
              Parsing and reviewing document structure...
            </div>
            <div style={{ color: 'var(--bh-text-muted)', fontSize: 12, marginTop: 6 }}>
              QA agent is checking heading hierarchy, fixing layout, and cleaning up
            </div>
          </div>
        </div>
      )}
      {state === 'rendering' && (
        <div className="loading-overlay">
          <div className="loading-card">
            <div className="spinner" />
            <div style={{ color: 'var(--bh-text)', fontSize: 14 }}>Rendering PDF...</div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {!hasDoc ? (
        <UploadZone onUpload={upload} onMergeUpload={mergeUpload} onPasteText={pasteText} />
      ) : (
        <>
          <div className="workspace">
            <OptionsPanel options={options} onChange={updateOptions} />
            <PreviewPane html={previewHtml} />
          </div>
          <DownloadBar
            state={state}
            onDownloadPdf={downloadPdf}
            onReset={reset}
            filename={filename}
          />
        </>
      )}
    </>
  );
}
