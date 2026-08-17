"use client";

import { useEffect, useRef, useState } from "react";

const WIDTH = 1920;
const HEIGHT = 600;
const ASPECT = WIDTH / HEIGHT;

export default function BannerImageEditor({ file, onReady }: { file: File | null; onReady: (file: File | null) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    if (!file) { imageRef.current = null; onReady(null); return; }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { imageRef.current = img; setZoom(1); setOffset({ x: 0, y: 0 }); draw(img, 1, { x: 0, y: 0 }); };
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function draw(img: HTMLImageElement | null = imageRef.current, z = zoom, o = offset) {
    const canvas = canvasRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const cw = canvas.clientWidth || 960, ch = cw / ASPECT;
    canvas.width = Math.round(cw * 2); canvas.height = Math.round(ch * 2);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const scale = Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight) * z;
    const w = img.naturalWidth * scale, h = img.naturalHeight * scale;
    ctx.drawImage(img, (canvas.width - w) / 2 + o.x * 2, (canvas.height - h) / 2 + o.y * 2, w, h);
  }

  useEffect(() => { draw(); }, [zoom, offset]);

  function pointerDown(e: React.PointerEvent<HTMLCanvasElement>) { e.currentTarget.setPointerCapture(e.pointerId); dragRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y }; }
  function pointerMove(e: React.PointerEvent<HTMLCanvasElement>) { const d = dragRef.current; if (!d) return; setOffset({ x: d.ox + e.clientX - d.x, y: d.oy + e.clientY - d.y }); }
  function pointerUp() { dragRef.current = null; }

  async function saveCrop() {
    const canvas = canvasRef.current; if (!canvas || !file) return;
    const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, "image/jpeg", 0.9));
    if (!blob) return;
    onReady(new File([blob], `${file.name.replace(/\.[^.]+$/, "")}-banner.jpg`, { type: "image/jpeg" }));
  }

  if (!file) return null;
  return <div className="grid gap-3 rounded-xl border bg-slate-50 p-3">
    <div className="flex items-center justify-between text-xs font-semibold text-slate-600"><span>Banner kesimi — 1920 × 600</span><span>Rasmni sichqoncha bilan siljiting</span></div>
    <canvas ref={canvasRef} className="w-full cursor-move rounded-lg bg-white" onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} />
    <label className="text-xs font-semibold">Zoom: {zoom.toFixed(1)}×<input type="range" min="1" max="3" step="0.1" value={zoom} onChange={e => setZoom(Number(e.target.value))} className="mt-1 w-full"/></label>
    <button type="button" onClick={saveCrop} className="rounded-lg border bg-white px-3 py-2 text-sm font-bold">Kesilgan rasmni qo‘llash</button>
  </div>;
}
