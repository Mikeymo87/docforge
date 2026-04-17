import React, { useState, useRef } from 'react';

const FORMATS = ['.md', '.txt', '.pdf', '.docx', '.html'];

export default function UploadZone({ onUpload, onMergeUpload, onPasteText }) {
  const [dragover, setDragover] = useState(false);
  const [mode, setMode] = useState('file'); // 'file' | 'merge' | 'paste'
  const [pasteContent, setPasteContent] = useState('');
  const [mergeFiles, setMergeFiles] = useState([]);
  const inputRef = useRef(null);
  const mergeInputRef = useRef(null);

  function handleDrop(e) {
    e.preventDefault();
    setDragover(false);
    const files = Array.from(e.dataTransfer.files);
    if (mode === 'merge') {
      setMergeFiles(prev => [...prev, ...files]);
    } else if (files.length > 1) {
      // Auto-switch to merge mode if multiple files dropped
      setMode('merge');
      setMergeFiles(files);
    } else if (files[0]) {
      onUpload(files[0]);
    }
  }

  function handleDragOver(e) {
    e.preventDefault();
    setDragover(true);
  }

  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) onUpload(file);
  }

  function handleMergeFileSelect(e) {
    const files = Array.from(e.target.files);
    setMergeFiles(prev => [...prev, ...files]);
  }

  function removeMergeFile(idx) {
    setMergeFiles(prev => prev.filter((_, i) => i !== idx));
  }

  function reorderMergeFile(idx, direction) {
    setMergeFiles(prev => {
      const arr = [...prev];
      const newIdx = idx + direction;
      if (newIdx < 0 || newIdx >= arr.length) return arr;
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return arr;
    });
  }

  function handleMergeSubmit() {
    if (mergeFiles.length >= 2) {
      onMergeUpload(mergeFiles);
    }
  }

  function handlePasteSubmit() {
    if (pasteContent.trim()) {
      onPasteText(pasteContent.trim());
    }
  }

  return (
    <div className="upload-zone-wrapper">
      <div style={{ width: '100%', maxWidth: 700 }}>
        {/* Mode Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 16, justifyContent: 'center' }}>
          {['file', 'merge', 'paste'].map(m => (
            <button
              key={m}
              className={`btn ${mode === m ? 'btn-pdf' : 'btn-secondary'}`}
              style={{ padding: '8px 20px', fontSize: 13 }}
              onClick={() => setMode(m)}
            >
              {m === 'file' ? 'Single File' : m === 'merge' ? 'Merge Files' : 'Paste Text'}
            </button>
          ))}
        </div>

        {/* SINGLE FILE MODE */}
        {mode === 'file' && (
          <div
            className={`upload-zone ${dragover ? 'dragover' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={() => setDragover(false)}
            onClick={() => inputRef.current?.click()}
          >
            <div className="upload-icon">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <rect x="4" y="8" width="40" height="32" rx="4" stroke="#2EA84A" strokeWidth="2" fill="none" />
                <path d="M24 18v12M18 24l6-6 6 6" stroke="#2EA84A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="upload-title">Drop your document here</div>
            <div className="upload-subtitle">or click to browse files</div>
            <div className="upload-formats">
              {FORMATS.map(f => (
                <span key={f} className="format-badge">{f.toUpperCase()}</span>
              ))}
            </div>
            <input
              ref={inputRef}
              type="file"
              accept={FORMATS.join(',')}
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </div>
        )}

        {/* MERGE MODE */}
        {mode === 'merge' && (
          <div>
            <div
              className={`upload-zone ${dragover ? 'dragover' : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={() => setDragover(false)}
              onClick={() => mergeInputRef.current?.click()}
              style={{ padding: '40px 40px' }}
            >
              <div className="upload-title" style={{ fontSize: 18 }}>
                Drop files to merge into one document
              </div>
              <div className="upload-subtitle">
                AI reads all documents and creates a single cohesive report
              </div>
              <input
                ref={mergeInputRef}
                type="file"
                accept={FORMATS.join(',')}
                multiple
                onChange={handleMergeFileSelect}
                style={{ display: 'none' }}
              />
            </div>

            {/* File List */}
            {mergeFiles.length > 0 && (
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontSize: 12, color: 'var(--bh-text-muted)', marginBottom: 4 }}>
                  {mergeFiles.length} file{mergeFiles.length !== 1 ? 's' : ''} — drag more or reorder:
                </div>
                {mergeFiles.map((f, i) => (
                  <div key={`${f.name}-${i}`} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: 'var(--bh-surface)', borderRadius: 8,
                    padding: '10px 14px', border: '1px solid var(--bh-border)',
                  }}>
                    <span style={{
                      width: 24, height: 24, borderRadius: '50%',
                      background: 'var(--bh-green)', color: 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700, flexShrink: 0,
                    }}>{i + 1}</span>
                    <span style={{ flex: 1, fontSize: 13, color: 'var(--bh-text)' }}>{f.name}</span>
                    <span style={{ fontSize: 11, color: 'var(--bh-text-muted)' }}>
                      {(f.size / 1024).toFixed(0)}KB
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); reorderMergeFile(i, -1); }}
                      disabled={i === 0}
                      style={{
                        background: 'none', border: 'none', color: i === 0 ? '#444' : 'var(--bh-text)',
                        cursor: i === 0 ? 'default' : 'pointer', fontSize: 16, padding: '0 4px',
                      }}
                    >↑</button>
                    <button
                      onClick={(e) => { e.stopPropagation(); reorderMergeFile(i, 1); }}
                      disabled={i === mergeFiles.length - 1}
                      style={{
                        background: 'none', border: 'none',
                        color: i === mergeFiles.length - 1 ? '#444' : 'var(--bh-text)',
                        cursor: i === mergeFiles.length - 1 ? 'default' : 'pointer',
                        fontSize: 16, padding: '0 4px',
                      }}
                    >↓</button>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeMergeFile(i); }}
                      style={{
                        background: 'none', border: 'none', color: '#E5554F',
                        cursor: 'pointer', fontSize: 14, fontWeight: 700, padding: '0 4px',
                      }}
                    >✕</button>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setMergeFiles([])}
                    style={{ padding: '8px 16px', fontSize: 13 }}
                  >Clear All</button>
                  <button
                    className="btn btn-pdf"
                    onClick={handleMergeSubmit}
                    disabled={mergeFiles.length < 2}
                    style={{ padding: '10px 28px' }}
                  >
                    AI Merge {mergeFiles.length} Files
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PASTE MODE */}
        {mode === 'paste' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <textarea
              value={pasteContent}
              onChange={e => setPasteContent(e.target.value)}
              placeholder="Paste your markdown, plain text, or any content here..."
              style={{
                width: '100%',
                minHeight: 360,
                background: 'var(--bh-surface)',
                border: '2px solid var(--bh-border)',
                borderRadius: 12,
                padding: 20,
                color: 'var(--bh-text)',
                fontFamily: "'SF Mono', 'Fira Code', monospace",
                fontSize: 13,
                lineHeight: 1.6,
                resize: 'vertical',
                outline: 'none',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--bh-green)'}
              onBlur={e => e.target.style.borderColor = 'var(--bh-border)'}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <span style={{ fontSize: 12, color: 'var(--bh-text-muted)', alignSelf: 'center', marginRight: 'auto' }}>
                Supports markdown, plain text, or copy-pasted content
              </span>
              <button
                className="btn btn-pdf"
                onClick={handlePasteSubmit}
                disabled={!pasteContent.trim()}
                style={{ padding: '10px 28px' }}
              >
                Format This
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
