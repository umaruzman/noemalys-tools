'use client';

import { useEffect, useRef, useState } from 'react';
import { zip } from 'fflate';
import type { Format, Settings } from './image.worker';
import s from './resizer.module.css';

type Result = { blob: Blob; width: number; height: number; overLimit: boolean };
type Row = { file: File; name: string; url?: string; result?: Result; error?: string };
const defaults: Settings = { width: 1600, height: 1600, format: 'image/webp', quality: 85, targetKB: 0 };
const extensions: Record<Format, string> = { 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/png': 'png' };
const presetKey = 'noemalys-image-preset-v1';
const size = (bytes: number) => bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export default function Resizer() {
  const [settings, setSettings] = useState(defaults);
  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [hasPreset, setHasPreset] = useState(false);
  const picker = useRef<HTMLInputElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const urls = useRef(new Set<string>());

  useEffect(() => {
    try { setHasPreset(!!localStorage.getItem(presetKey)); } catch {}
    const previews = urls.current;
    return () => {
      workerRef.current?.terminate();
      previews.forEach(url => URL.revokeObjectURL(url));
      previews.clear();
    };
  }, []);

  function addFiles(files: FileList) {
    const accepted = Array.from(files).filter(file => /\.(jpe?g|png|webp)$/i.test(file.name) || ['image/jpeg','image/png','image/webp'].includes(file.type));
    const added = accepted.map(file => {
      const url = URL.createObjectURL(file);
      urls.current.add(url);
      return { file, url, name: file.name };
    });
    setRows(current => [...current, ...added]);
    setStatus(accepted.length === files.length ? '' : 'JPEG, PNG and WebP files are supported. Other files were skipped.');
  }

  function remove(row: Row) {
    if (row.url) {
      URL.revokeObjectURL(row.url);
      urls.current.delete(row.url);
    }
    setRows(current => current.filter(item => item !== row));
  }

  async function processBatch() {
    setBusy(true);
    setStatus('Preparing images…');
    try {
      const worker = new Worker(new URL('./image.worker.ts', import.meta.url));
      workerRef.current = worker;
      const names = new Set<string>();
      for (const [index, row] of rows.entries()) {
        setStatus(`Processing ${index + 1} of ${rows.length}…`);
        const outcome = await new Promise<Result | { error: string }>((resolve, reject) => {
          worker.onmessage = event => resolve(event.data);
          worker.onerror = () => reject(new Error("Image processing is unavailable in this browser."));
          worker.onmessageerror = () => reject(new Error("Could not receive the processed image."));
          worker.postMessage({ file: row.file, settings });
        });
        const base = (row.file.name.replace(/\.[^.]+$/, '') || 'image').replace(/[\\/\u0000-\u001f]/g, '_');
        const extension = extensions[settings.format];
        let name = `${base}.${extension}`;
        for (let suffix = 2; names.has(name.toLowerCase()); suffix++) name = `${base}-${suffix}.${extension}`;
        names.add(name.toLowerCase());
        const updated = 'error' in outcome
          ? { ...row, result: undefined, error: outcome.error }
          : { ...row, name, result: outcome, error: undefined };
        setRows(current => current.map((item, position) => position === index ? updated : item));
      }
      setStatus('Batch finished.');
    } catch {
      setStatus('Could not start image processing in this browser.');
    } finally {
      workerRef.current?.terminate();
      workerRef.current = null;
      setBusy(false);
    }
  }

  async function downloadZip() {
    setBusy(true);
    setStatus('Preparing ZIP…');
    try {
      const files: Record<string, Uint8Array> = Object.create(null);
      for (const row of rows) {
        if (row.result) files[row.name] = new Uint8Array(await row.result.blob.arrayBuffer());
      }
      const archive = await new Promise<Uint8Array>((resolve, reject) =>
        zip(files, { level: 0 }, (error, bytes) => error ? reject(error) : resolve(bytes))
      );
      download(new Blob([new Uint8Array(archive)], { type: 'application/zip' }), 'noemalys-images.zip');
      setStatus('ZIP ready.');
    } catch { setStatus('Could not create the ZIP. You can download images individually.'); }
    finally { setBusy(false); }
  }

  function preset(action: 'save' | 'load') {
    try {
      if (action === 'save') {
        localStorage.setItem(presetKey, JSON.stringify(settings));
        setHasPreset(true);
        setStatus('Preset saved on this device.');
      } else {
        const saved = localStorage.getItem(presetKey);
        if (saved) {
          setSettings({ ...defaults, ...JSON.parse(saved) });
          setStatus('Preset loaded.');
        } else {
          setHasPreset(false);
        }
      }
    } catch { setStatus('The browser could not access your preset.'); }
  }

  const count = rows.filter(row => row.result).length;
  return <form onSubmit={event => { event.preventDefault(); if (!busy && rows.length) void processBatch(); }}>
    <div className={s.workspace}>
      <section className={s.images} aria-labelledby="images">
        <div className={s.sectionHead}><h2 id="images">Images</h2><span>{rows.length} selected</span></div>
        <div className={`${s.drop} ${dragging ? s.dragging : ''}`}
          onDragOver={event => { event.preventDefault(); if (!busy) setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={event => {
            event.preventDefault();
            setDragging(false);
            if (!busy) addFiles(event.dataTransfer.files);
          }}>
          <div className={s.picture} aria-hidden="true"><i /></div>
          <strong>Drop images here</strong>
          <p>JPEG, PNG or WebP</p>
          <input hidden ref={picker} type="file" multiple accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            onChange={event => { if (event.target.files) addFiles(event.target.files); event.target.value = ''; }} />
          <button type="button" className={s.secondary} disabled={busy} onClick={() => picker.current?.click()}>Choose files</button>
        </div>
        {rows.length > 0 && <ul className={s.files}>
          {rows.map((row, index) => <li key={row.url}>
            <img src={row.url} alt="" width="44" height="44" />
            <div className={s.fileText}><strong>{row.file.name}</strong>
              <span>{size(row.file.size)}{row.result && ` → ${size(row.result.blob.size)} · ${row.result.width} × ${row.result.height}`}</span>
              {row.result?.overLimit && <span className={s.warning}>Above target size</span>}
              {row.error && <span className={s.warning}>{row.error}</span>}
            </div>
            {row.result && <button type="button" disabled={busy} onClick={() => row.result && download(row.result.blob, row.name)} aria-label={`Download ${row.name}`}>Save</button>}
            <button type="button" disabled={busy} onClick={() => remove(row)} aria-label={`Remove image ${index + 1}: ${row.file.name}`}>×</button>
          </li>)}
        </ul>}
      </section>
      <section className={s.settings} aria-labelledby="settings">
        <div className={s.sectionHead}><h2 id="settings">Output settings</h2></div>
        <fieldset disabled={busy}>
          <div className={s.dimensions}>
            <label>Max width <input type="number" min="1" max="8192" required value={settings.width || ''} onChange={event => setSettings({ ...settings, width: Number(event.target.value) })} /></label>
            <label>Max height <input type="number" min="1" max="8192" required value={settings.height || ''} onChange={event => setSettings({ ...settings, height: Number(event.target.value) })} /></label>
          </div>
          <p className={s.note}>Pixels. Keeps proportions and avoids enlarging.</p>
          <label>Format <select value={settings.format} onChange={event => setSettings({ ...settings, format: event.target.value as Format })}>
            <option value="image/webp">WebP</option><option value="image/jpeg">JPEG</option><option value="image/png">PNG</option>
          </select></label>
          {settings.format !== 'image/png' && <label><span className={s.rangeLabel}>Quality <output>{settings.quality}%</output></span>
            <input type="range" min="1" max="100" value={settings.quality} onChange={event => setSettings({ ...settings, quality: Number(event.target.value) })} />
          </label>}
          <label>Target size <span className={s.optional}>optional</span>
            <input type="number" min="1" max="100000" value={settings.targetKB || ''} placeholder="KB per image" onChange={event => setSettings({ ...settings, targetKB: Number(event.target.value) })} />
          </label>
          <p className={s.note}>Quality can be reduced for JPEG and WebP to help reach the target.</p>
          <div className={s.presets}><button type="button" className={s.secondary} onClick={() => preset('save')}>Save preset</button>
            {hasPreset && <button type="button" className={s.secondary} onClick={() => preset('load')}>Load preset</button>}</div>
        </fieldset>
        <button className={s.primary} type="submit" disabled={!rows.length || busy}>Process images</button>
        {count > 0 && <button className={s.zip} type="button" disabled={busy} onClick={downloadZip}>Download ZIP ({count})</button>}
      </section>
    </div>
    <p className={s.status} role="status">{status}</p>
  </form>;
}
