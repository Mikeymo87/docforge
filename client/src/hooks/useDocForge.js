import { useState, useCallback, useRef } from 'react';

const INITIAL_OPTIONS = {
  template: 'executive-brief',
  coverStyle: 'none',
  title: '',
  subtitle: '',
  docType: 'Report',
  showFooter: true,
  showMasthead: true,
  pageSize: 'Letter',
  orientation: 'portrait',
};

export function useDocForge() {
  const [state, setState] = useState('idle'); // idle | uploading | parsed | previewing | rendering
  const [doc, setDoc] = useState(null);
  const [filename, setFilename] = useState('');
  const [options, setOptions] = useState(INITIAL_OPTIONS);
  const [previewUrl, setPreviewUrl] = useState('');
  const previewBlobRef = useRef(null);
  const [error, setError] = useState('');
  const debounceRef = useRef(null);

  const upload = useCallback(async (file) => {
    setState('uploading');
    setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setDoc(data.doc);
      setFilename(data.filename);
      setOptions(prev => ({
        ...prev,
        title: data.doc.metadata.title || '',
        subtitle: data.doc.metadata.subtitle || '',
      }));
      setState('parsed');

      // Auto-preview
      fetchPreview(data.doc, {
        ...INITIAL_OPTIONS,
        title: data.doc.metadata.title || '',
        subtitle: data.doc.metadata.subtitle || '',
      });
    } catch (err) {
      setError(err.message);
      setState('idle');
    }
  }, []);

  const mergeUpload = useCallback(async (files) => {
    setState('uploading');
    setError('');
    try {
      const form = new FormData();
      files.forEach(f => form.append('files', f));
      const res = await fetch('/api/upload/merge', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setDoc(data.doc);
      setFilename(`${data.fileCount} files merged`);
      setOptions(prev => ({
        ...prev,
        title: data.doc.metadata.title || '',
        subtitle: data.doc.metadata.subtitle || '',
      }));
      setState('parsed');

      fetchPreview(data.doc, {
        ...INITIAL_OPTIONS,
        title: data.doc.metadata.title || '',
        subtitle: data.doc.metadata.subtitle || '',
      });
    } catch (err) {
      setError(err.message);
      setState('idle');
    }
  }, []);

  const fetchPreview = useCallback(async (docData, opts) => {
    setState('previewing');
    try {
      const res = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doc: docData, options: opts, format: 'preview' }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      const blob = await res.blob();
      // Revoke previous blob URL to avoid memory leaks
      if (previewBlobRef.current) URL.revokeObjectURL(previewBlobRef.current);
      const url = URL.createObjectURL(blob);
      previewBlobRef.current = url;
      setPreviewUrl(url);
      setState('parsed');
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const updateOptions = useCallback((newOpts) => {
    setOptions(prev => {
      const merged = { ...prev, ...newOpts };
      // Debounce preview refresh
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (doc) fetchPreview(doc, merged);
      }, 400);
      return merged;
    });
  }, [doc, fetchPreview]);

  const downloadPdf = useCallback(async () => {
    if (!doc) return;
    setState('rendering');
    try {
      const res = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doc, options, format: 'pdf' }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const slug = (options.title || 'document')
        .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      a.href = url;
      a.download = `BH-${slug}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setState('parsed');
    } catch (err) {
      setError(err.message);
      setState('parsed');
    }
  }, [doc, options]);

  const pasteText = useCallback(async (text) => {
    setState('uploading');
    setError('');
    try {
      // Detect if content looks like markdown
      const hasMarkdown = /^#{1,6}\s|^\*\*|^\|.*\||\[.*\]\(|^>\s|^```/m.test(text);
      const ext = hasMarkdown ? '.md' : '.txt';
      const blob = new Blob([text], { type: 'text/plain' });
      const file = new File([blob], `pasted-content${ext}`, { type: 'text/plain' });

      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setDoc(data.doc);
      setFilename('Pasted content');
      setOptions(prev => ({
        ...prev,
        title: data.doc.metadata.title || '',
        subtitle: data.doc.metadata.subtitle || '',
      }));
      setState('parsed');

      fetchPreview(data.doc, {
        ...INITIAL_OPTIONS,
        title: data.doc.metadata.title || '',
        subtitle: data.doc.metadata.subtitle || '',
      });
    } catch (err) {
      setError(err.message);
      setState('idle');
    }
  }, [fetchPreview]);

  const reset = useCallback(() => {
    setDoc(null);
    setFilename('');
    setOptions(INITIAL_OPTIONS);
    if (previewBlobRef.current) URL.revokeObjectURL(previewBlobRef.current);
    previewBlobRef.current = null;
    setPreviewUrl('');
    setError('');
    setState('idle');
  }, []);

  return {
    state, doc, filename, options, previewUrl, error,
    upload, mergeUpload, pasteText, updateOptions, downloadPdf, reset,
  };
}
