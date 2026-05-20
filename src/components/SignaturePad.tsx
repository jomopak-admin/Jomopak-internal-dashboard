/**
 * SignaturePad — Phase 17 (Task #101)
 *
 * Tiny hand-rolled signature canvas: no external deps, no pointer-events
 * polyfills. We rely on the standard Pointer Events API which works the
 * same on mouse, touch, and stylus. Strokes are stored as plain points
 * and rasterised once on commit, so the parent always receives a PNG
 * data URL ready to upload to Supabase Storage.
 *
 * The canvas auto-sizes to its container width and uses devicePixelRatio
 * to stay crisp on phones. We deliberately do *not* persist state in the
 * component — the parent decides when to clear/save/restore.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

interface SignaturePadProps {
  /** Called with a PNG data URL whenever the signature changes meaningfully
   *  (after each completed stroke). Empty string means "cleared". */
  onChange: (dataUrl: string) => void;
  /** Pixel height of the drawing area (the width is fluid). */
  height?: number;
  /** Optional label shown above the canvas. */
  label?: string;
  /** Optional disabled state. */
  disabled?: boolean;
}

type Point = { x: number; y: number };

export function SignaturePad({ onChange, height = 180, label = 'Sign here', disabled = false }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef<boolean>(false);
  const lastRef = useRef<Point | null>(null);
  // Tracks whether anything has been drawn so we can disable Clear when empty
  // and avoid emitting empty-data-url changes on first focus.
  const [hasInk, setHasInk] = useState(false);

  // Size + clear canvas. Runs on mount and on container resize.
  const resetCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const cssWidth = canvas.clientWidth;
    const cssHeight = height;
    canvas.width = Math.round(cssWidth * ratio);
    canvas.height = Math.round(cssHeight * ratio);
    canvas.style.height = `${cssHeight}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, cssWidth, cssHeight);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
  }, [height]);

  useEffect(() => {
    resetCanvas();
    const handle = () => resetCanvas();
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, [resetCanvas]);

  function getPoint(e: React.PointerEvent<HTMLCanvasElement>): Point {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (disabled) return;
    drawingRef.current = true;
    lastRef.current = getPoint(e);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current || disabled) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !lastRef.current) return;
    const p = getPoint(e);
    ctx.beginPath();
    ctx.moveTo(lastRef.current.x, lastRef.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    lastRef.current = p;
    if (!hasInk) setHasInk(true);
  }

  function commitStroke() {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    lastRef.current = null;
    const canvas = canvasRef.current;
    if (!canvas) return;
    onChange(canvas.toDataURL('image/png'));
  }

  function onPointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
    commitStroke();
  }

  function clear() {
    if (disabled) return;
    resetCanvas();
    setHasInk(false);
    onChange('');
  }

  return (
    <div className="signature-pad">
      <div className="signature-pad-header">
        <span>{label}</span>
        <button
          type="button"
          className="link-button"
          onClick={clear}
          disabled={!hasInk || disabled}
        >
          Clear
        </button>
      </div>
      <canvas
        ref={canvasRef}
        className={disabled ? 'signature-pad-canvas is-disabled' : 'signature-pad-canvas'}
        style={{ touchAction: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={onPointerUp}
      />
      <p className="signature-pad-hint">Sign with finger, stylus, or mouse.</p>
    </div>
  );
}
