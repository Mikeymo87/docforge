import React from 'react';

const TEMPLATES = [
  { id: 'executive-brief', name: 'Executive Brief', desc: 'Clean, corporate, single-column' },
  { id: 'full-report', name: 'Full Report', desc: 'Cover page, table of contents, running headers' },
  { id: 'magazine', name: 'Magazine', desc: 'Editorial: drop caps, pull quotes, gradient cover' },
];

const PAGE_SIZES = [
  { id: 'Letter', label: 'Letter (8.5 x 11)' },
  { id: 'Legal', label: 'Legal (8.5 x 14)' },
  { id: 'A4', label: 'A4' },
];

const COVER_STYLES = [
  { id: 'none', name: 'No Cover', desc: 'Jump straight to content' },
  { id: 'dark', name: 'Dark', desc: 'Black background, title at bottom, green accent' },
  { id: 'gradient', name: 'Gradient', desc: 'Dark-to-green gradient, pineapple watermark' },
  { id: 'minimal', name: 'Minimal', desc: 'White, centered title, clean divider' },
];

const TOGGLES = [
  { key: 'showMasthead', label: 'Masthead' },
  { key: 'showFooter', label: 'Footer' },
];

export default function OptionsPanel({ options, onChange }) {
  return (
    <div className="sidebar">
      {/* Template Selection */}
      <div>
        <h3>Template</h3>
        <div className="template-cards">
          {TEMPLATES.map(t => (
            <div
              key={t.id}
              className={`template-card ${options.template === t.id ? 'active' : ''}`}
              onClick={() => onChange({ template: t.id })}
            >
              <div className="template-card-name">{t.name}</div>
              <div className="template-card-desc">{t.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Cover Style */}
      <div>
        <h3>Cover Page</h3>
        <div className="template-cards">
          {COVER_STYLES.map(c => (
            <div
              key={c.id}
              className={`template-card ${(options.coverStyle || 'none') === c.id ? 'active' : ''}`}
              onClick={() => onChange({ coverStyle: c.id })}
              style={{ padding: '8px 12px' }}
            >
              <div className="template-card-name" style={{ fontSize: 13 }}>{c.name}</div>
              <div className="template-card-desc">{c.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Page Setup */}
      <div>
        <h3>Page Setup</h3>
        <div className="field-group">
          <label className="field-label">Page Size</label>
          <select
            className="field-input"
            value={options.pageSize || 'Letter'}
            onChange={e => onChange({ pageSize: e.target.value })}
          >
            {PAGE_SIZES.map(s => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>
        <div className="field-group" style={{ marginTop: 10 }}>
          <label className="field-label">Orientation</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {['portrait', 'landscape'].map(o => (
              <div
                key={o}
                className={`template-card ${(options.orientation || 'portrait') === o ? 'active' : ''}`}
                onClick={() => onChange({ orientation: o })}
                style={{ flex: 1, padding: '8px 12px', textAlign: 'center' }}
              >
                <div className="template-card-name" style={{ fontSize: 13 }}>
                  {o.charAt(0).toUpperCase() + o.slice(1)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Metadata */}
      <div>
        <h3>Document Info</h3>
        <div className="field-group">
          <label className="field-label">Title</label>
          <input
            className="field-input"
            value={options.title}
            onChange={e => onChange({ title: e.target.value })}
          />
        </div>
        <div className="field-group" style={{ marginTop: 10 }}>
          <label className="field-label">Subtitle</label>
          <input
            className="field-input"
            value={options.subtitle}
            onChange={e => onChange({ subtitle: e.target.value })}
          />
        </div>
        <div className="field-group" style={{ marginTop: 10 }}>
          <label className="field-label">Document Type</label>
          <input
            className="field-input"
            value={options.docType}
            onChange={e => onChange({ docType: e.target.value })}
            placeholder="Report, Brief, Analysis..."
          />
        </div>
      </div>

      {/* Toggles */}
      <div>
        <h3>Sections</h3>
        {TOGGLES.map(t => (
          <div key={t.key} className="toggle-row">
            <span className="toggle-label">{t.label}</span>
            <div
              className={`toggle-switch ${options[t.key] ? 'on' : ''}`}
              onClick={() => onChange({ [t.key]: !options[t.key] })}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
