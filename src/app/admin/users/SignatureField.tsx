'use client';

import { useEffect, useRef, useState } from 'react';
import { withBasePath } from '@/lib/base-path';

const MAX_PNG_BYTES = 1_572_864;
const MAX_DIM = 800;
const DRAW_HEIGHT = 160;

export type SignatureChange = {
  signaturePng?: string;
  clearSignature?: boolean;
};

export function SignatureField({
  userId,
  hasSignature,
  disabled,
  onChange,
}: {
  userId: string;
  hasSignature: boolean;
  disabled?: boolean;
  onChange: (next: SignatureChange | null) => void;
}) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [cleared, setCleared] = useState(false);
  const [busy, setBusy] = useState('');
  const [localError, setLocalError] = useState('');

  const storedSrc = hasSignature && !cleared && !preview
    ? withBasePath(`/api/admin/users?id=${encodeURIComponent(userId)}`)
    : null;
  const shownSrc = preview || storedSrc;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const id = requestAnimationFrame(() => resetDrawCanvas(canvas));
    return () => cancelAnimationFrame(id);
  }, [userId]);

  function emitPng(dataUrl: string) {
    setLocalError('');
    const raw = dataUrl.includes(',') ? dataUrl.slice(dataUrl.indexOf(',') + 1) : dataUrl;
    const bytes = Math.ceil((raw.length * 3) / 4);
    if (bytes > MAX_PNG_BYTES) {
      setLocalError('簽署檔案過大（上限約 1.5MB）');
      return;
    }
    setPreview(dataUrl);
    setCleared(false);
    onChange({ signaturePng: raw });
  }

  function handleClear() {
    setLocalError('');
    setPreview(null);
    setCleared(true);
    onChange(hasSignature ? { clearSignature: true } : null);
    if (canvasRef.current) resetDrawCanvas(canvasRef.current);
  }

  async function onImageFile(file: File | undefined) {
    if (!file) return;
    setBusy('讀取圖片…');
    setLocalError('');
    try {
      const dataUrl = await fileToPngDataUrl(file);
      emitPng(dataUrl);
    } catch {
      setLocalError('無法讀取圖片');
    } finally {
      setBusy('');
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  }

  async function onPdfFile(file: File | undefined) {
    if (!file) return;
    setBusy('讀取 PDF…');
    setLocalError('');
    try {
      const dataUrl = await pdfFirstPageToPng(file);
      emitPng(dataUrl);
    } catch {
      setLocalError('無法讀取 PDF（僅使用第 1 頁）');
    } finally {
      setBusy('');
      if (pdfInputRef.current) pdfInputRef.current.value = '';
    }
  }

  function pointerPos(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (disabled) return;
    const canvas = e.currentTarget;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.setPointerCapture(e.pointerId);
    drawing.current = true;
    const { x, y } = pointerPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = e.currentTarget.getContext('2d');
    if (!ctx) return;
    const { x, y } = pointerPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function onPointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    drawing.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    emitPng(e.currentTarget.toDataURL('image/png'));
  }

  function redraw() {
    if (canvasRef.current) resetDrawCanvas(canvasRef.current);
  }

  return (
    <div className="form-group">
      <label>簽署</label>
      <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>
        上傳圖片、PDF 第 1 頁，或在畫板上簽署。租單 PDF 會印上此簽署。
      </p>
      <div
        style={{
          border: '1px solid var(--border)',
          borderRadius: '6px',
          background: '#fff',
          minHeight: 80,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0.5rem',
          marginBottom: '0.5rem',
        }}
      >
        {shownSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={shownSrc}
            alt="簽署預覽"
            style={{ maxHeight: 80, maxWidth: '100%', objectFit: 'contain' }}
          />
        ) : (
          <span style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>尚未設定簽署</span>
        )}
      </div>
      <canvas
        ref={canvasRef}
        width={480}
        height={DRAW_HEIGHT}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={onPointerUp}
        title="在畫板上簽署"
        style={{
          width: '100%',
          height: DRAW_HEIGHT,
          border: '1px solid var(--border)',
          borderRadius: '6px',
          background: '#fff',
          cursor: disabled ? 'not-allowed' : 'crosshair',
          touchAction: 'none',
          marginBottom: '0.5rem',
        }}
      />
      {localError && (
        <div
          style={{
            padding: '0.5rem',
            marginBottom: '0.5rem',
            background: '#fef2f2',
            color: 'var(--error)',
            borderRadius: '6px',
            fontSize: '0.875rem',
          }}
        >
          {localError}
        </div>
      )}
      {busy && (
        <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>{busy}</p>
      )}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/*"
        hidden
        disabled={disabled}
        onChange={(e) => void onImageFile(e.target.files?.[0])}
      />
      <input
        ref={pdfInputRef}
        type="file"
        accept="application/pdf"
        hidden
        disabled={disabled}
        onChange={(e) => void onPdfFile(e.target.files?.[0])}
      />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={disabled || !!busy}
          title="上傳 PNG、JPEG 或 WebP 圖片作為簽署"
          onClick={() => imageInputRef.current?.click()}
        >
          上傳圖片
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={disabled || !!busy}
          title="上傳 PDF，僅使用第 1 頁作為簽署"
          onClick={() => pdfInputRef.current?.click()}
        >
          上傳 PDF
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={disabled}
          title="清除畫板以便重新簽署"
          onClick={redraw}
        >
          重畫
        </button>
        <button
          type="button"
          className="btn btn-danger"
          disabled={disabled || (!shownSrc && !hasSignature)}
          title="清除已儲存及預覽中的簽署"
          onClick={handleClear}
        >
          清除簽署
        </button>
      </div>
    </div>
  );
}

function resetDrawCanvas(canvas: HTMLCanvasElement) {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const cssW = canvas.clientWidth || 480;
  canvas.width = Math.max(1, Math.round(cssW * dpr));
  canvas.height = Math.max(1, Math.round(DRAW_HEIGHT * dpr));
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, cssW, DRAW_HEIGHT);
  ctx.strokeStyle = '#111';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image'));
    img.src = src;
  });
}

function canvasToScaledPng(source: HTMLCanvasElement | HTMLImageElement): string {
  const srcW = 'naturalWidth' in source ? source.naturalWidth || source.width : source.width;
  const srcH = 'naturalHeight' in source ? source.naturalHeight || source.height : source.height;
  const scale = Math.min(1, MAX_DIM / Math.max(srcW, srcH, 1));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(srcW * scale));
  canvas.height = Math.max(1, Math.round(srcH * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/png');
}

async function fileToPngDataUrl(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    return canvasToScaledPng(img);
  } finally {
    URL.revokeObjectURL(url);
  }
}

const PDFJS_VERSION = '3.11.174';

type PdfjsLib = {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (src: { data: Uint8Array }) => {
    promise: Promise<{
      getPage: (n: number) => Promise<{
        getViewport: (opts: { scale: number }) => { width: number; height: number };
        render: (opts: {
          canvasContext: CanvasRenderingContext2D;
          viewport: { width: number; height: number };
        }) => { promise: Promise<void> };
      }>;
    }>;
  };
};

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('pdfjs'));
    document.head.appendChild(script);
  });
}

async function loadPdfjs(): Promise<PdfjsLib> {
  const w = window as unknown as { pdfjsLib?: PdfjsLib };
  if (!w.pdfjsLib) {
    await loadScript(`https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.js`);
  }
  if (!w.pdfjsLib) throw new Error('pdfjs');
  w.pdfjsLib.GlobalWorkerOptions.workerSrc =
    `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`;
  return w.pdfjsLib;
}

async function pdfFirstPageToPng(file: File): Promise<string> {
  const pdfjs = await loadPdfjs();
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjs.getDocument({ data }).promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 2 });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport }).promise;
  return canvasToScaledPng(canvas);
}
