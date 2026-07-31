'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Dropzone } from '@/components/dropzone';
import { ToolLayout } from '@/components/tool-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Download, RotateCcw } from 'lucide-react';
import { getTool } from '@/lib/tools';
import {
  downloadBlob,
  fileToDataURL,
  loadImage,
  baseName,
} from '@/lib/file-utils';

const tool = getTool('crop-image')!;

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const aspectPresets: { label: string; value: number | null }[] = [
  { label: 'Free', value: null },
  { label: '1:1', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '3:4', value: 3 / 4 },
  { label: '16:9', value: 16 / 9 },
  { label: '9:16', value: 9 / 16 },
  { label: '3:2', value: 3 / 2 },
  { label: '2:3', value: 2 / 3 },
];

type HandleId = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | null;
type Mode = 'move' | 'resize' | 'draw' | null;

interface DragState {
  mode: Mode;
  handle: HandleId;
  startCanvas: { x: number; y: number };
  startRect: Rect;
}

export default function CropImagePage() {
  const [file, setFile] = useState<File | null>(null);
  const [imgUrl, setImgUrl] = useState('');
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [rect, setRect] = useState<Rect>({ x: 0, y: 0, w: 0, h: 0 });
  const [aspect, setAspect] = useState<number | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<DragState>({
    mode: null,
    handle: null,
    startCanvas: { x: 0, y: 0 },
    startRect: { x: 0, y: 0, w: 0, h: 0 },
  });

  const handleFile = async (files: File[]) => {
    const f = files[0];
    setFile(f);
    setResult(null);
    const url = await fileToDataURL(f);
    setImgUrl(url);
    const loaded = await loadImage(url);
    setImg(loaded);
    setRect({ x: 0, y: 0, w: loaded.naturalWidth, h: loaded.naturalHeight });
  };

  const reset = () => {
    setFile(null);
    setImgUrl('');
    setImg(null);
    setResult(null);
  };

  const getCanvasPos = (e: React.PointerEvent) => {
    const canvas = canvasRef.current!;
    const r = canvas.getBoundingClientRect();
    const sx = canvas.width / r.width;
    const sy = canvas.height / r.height;
    return {
      x: (e.clientX - r.left) * sx,
      y: (e.clientY - r.top) * sy,
    };
  };

  const toImg = useCallback(
    (p: { x: number; y: number }) => {
      if (!img || !canvasRef.current) return { x: 0, y: 0 };
      return {
        x: (p.x / canvasRef.current.width) * img.naturalWidth,
        y: (p.y / canvasRef.current.height) * img.naturalHeight,
      };
    },
    [img]
  );

  const toCanvas = useCallback(
    (r: Rect) => {
      if (!img || !canvasRef.current) return { x: 0, y: 0, w: 0, h: 0 };
      return {
        x: (r.x / img.naturalWidth) * canvasRef.current.width,
        y: (r.y / img.naturalHeight) * canvasRef.current.height,
        w: (r.w / img.naturalWidth) * canvasRef.current.width,
        h: (r.h / img.naturalHeight) * canvasRef.current.height,
      };
    },
    [img]
  );

  // Draw preview overlay
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !img) return;
    const maxW = 640;
    const scale = Math.min(1, maxW / img.naturalWidth);
    canvas.width = img.naturalWidth * scale;
    canvas.height = img.naturalHeight * scale;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const c = toCanvas(rect);
    // darken outside
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, canvas.width, c.y);
    ctx.fillRect(0, c.y + c.h, canvas.width, canvas.height - c.y - c.h);
    ctx.fillRect(0, c.y, c.x, c.h);
    ctx.fillRect(c.x + c.w, c.y, canvas.width - c.x - c.w, c.h);

    // selection border
    ctx.strokeStyle = '#0ea5e9';
    ctx.lineWidth = 2;
    ctx.strokeRect(c.x, c.y, c.w, c.h);

    // grid thirds
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(c.x + (c.w / 3) * i, c.y);
      ctx.lineTo(c.x + (c.w / 3) * i, c.y + c.h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(c.x, c.y + (c.h / 3) * i);
      ctx.lineTo(c.x + c.w, c.y + (c.h / 3) * i);
      ctx.stroke();
    }

    // 8 handles
    const hs = 7;
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#0ea5e9';
    ctx.lineWidth = 1.5;
    const drawHandle = (hx: number, hy: number) => {
      ctx.fillRect(hx - hs, hy - hs, hs * 2, hs * 2);
      ctx.strokeRect(hx - hs, hy - hs, hs * 2, hs * 2);
    };
    drawHandle(c.x, c.y); // nw
    drawHandle(c.x + c.w / 2, c.y); // n
    drawHandle(c.x + c.w, c.y); // ne
    drawHandle(c.x + c.w, c.y + c.h / 2); // e
    drawHandle(c.x + c.w, c.y + c.h); // se
    drawHandle(c.x + c.w / 2, c.y + c.h); // s
    drawHandle(c.x, c.y + c.h); // sw
    drawHandle(c.x, c.y + c.h / 2); // w
  }, [img, rect, result, toCanvas]);

  const hitTestHandle = (p: { x: number; y: number }): HandleId => {
    const c = toCanvas(rect);
    const tol = 12;
    const handles: [HandleId, number, number][] = [
      ['nw', c.x, c.y],
      ['n', c.x + c.w / 2, c.y],
      ['ne', c.x + c.w, c.y],
      ['e', c.x + c.w, c.y + c.h / 2],
      ['se', c.x + c.w, c.y + c.h],
      ['s', c.x + c.w / 2, c.y + c.h],
      ['sw', c.x, c.y + c.h],
      ['w', c.x, c.y + c.h / 2],
    ];
    for (const [id, hx, hy] of handles) {
      if (Math.abs(p.x - hx) < tol && Math.abs(p.y - hy) < tol) return id;
    }
    return null;
  };

  const isInsideRect = (p: { x: number; y: number }) => {
    const c = toCanvas(rect);
    return p.x >= c.x && p.x <= c.x + c.w && p.y >= c.y && p.y <= c.y + c.h;
  };

  const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, v));

  const onPointerDown = (e: React.PointerEvent) => {
    if (!img) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = getCanvasPos(e);
    const handle = hitTestHandle(p);
    if (handle) {
      dragRef.current = {
        mode: 'resize',
        handle,
        startCanvas: p,
        startRect: { ...rect },
      };
    } else if (isInsideRect(p)) {
      dragRef.current = {
        mode: 'move',
        handle: null,
        startCanvas: p,
        startRect: { ...rect },
      };
    } else {
      // start drawing a new selection
      const imgP = toImg(p);
      const newRect = { x: imgP.x, y: imgP.y, w: 0, h: 0 };
      setRect(newRect);
      dragRef.current = {
        mode: 'draw',
        handle: null,
        startCanvas: p,
        startRect: newRect,
      };
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!img || !dragRef.current.mode) return;
    const p = getCanvasPos(e);
    const imgP = toImg(p);
    const ds = dragRef.current;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;

    if (ds.mode === 'draw') {
      const startImg = toImg(ds.startCanvas);
      let x = Math.min(startImg.x, imgP.x);
      let y = Math.min(startImg.y, imgP.y);
      let w = Math.abs(imgP.x - startImg.x);
      let h = Math.abs(imgP.y - startImg.y);
      if (aspect) {
        if (w / aspect > h) h = w / aspect;
        else w = h * aspect;
      }
      x = clamp(x, 0, iw - 10);
      y = clamp(y, 0, ih - 10);
      w = clamp(w, 10, iw - x);
      h = clamp(h, 10, ih - y);
      setRect({ x, y, w, h });
      return;
    }

    if (ds.mode === 'move') {
      const startImg = toImg(ds.startCanvas);
      const dx = imgP.x - startImg.x;
      const dy = imgP.y - startImg.y;
      setRect({
        x: clamp(ds.startRect.x + dx, 0, iw - ds.startRect.w),
        y: clamp(ds.startRect.y + dy, 0, ih - ds.startRect.h),
        w: ds.startRect.w,
        h: ds.startRect.h,
      });
      return;
    }

    // resize
    const startImg = toImg(ds.startCanvas);
    const dx = imgP.x - startImg.x;
    const dy = imgP.y - startImg.y;
    let { x, y, w, h } = ds.startRect;
    const hd = ds.handle!;
    const minSize = 10;

    if (hd.includes('e')) w = Math.max(minSize, ds.startRect.w + dx);
    if (hd.includes('s')) h = Math.max(minSize, ds.startRect.h + dy);
    if (hd.includes('w')) {
      const newW = Math.max(minSize, ds.startRect.w - dx);
      x = ds.startRect.x + (ds.startRect.w - newW);
      w = newW;
    }
    if (hd.includes('n')) {
      const newH = Math.max(minSize, ds.startRect.h - dy);
      y = ds.startRect.y + (ds.startRect.h - newH);
      h = newH;
    }

    // aspect ratio lock
    if (aspect) {
      const isCorner = hd === 'nw' || hd === 'ne' || hd === 'se' || hd === 'sw';
      const isHorizontal = hd === 'w' || hd === 'e';
      const isVertical = hd === 'n' || hd === 's';
      if (isCorner) {
        if (Math.abs(dx) > Math.abs(dy)) {
          h = w / aspect;
        } else {
          w = h * aspect;
        }
        if (hd.includes('n')) y = ds.startRect.y + (ds.startRect.h - h);
        if (hd.includes('w')) x = ds.startRect.x + (ds.startRect.w - w);
      } else if (isHorizontal) {
        h = w / aspect;
        if (hd.includes('n')) y = ds.startRect.y + (ds.startRect.h - h);
      } else if (isVertical) {
        w = h * aspect;
        if (hd.includes('w')) x = ds.startRect.x + (ds.startRect.w - w);
      }
    }

    x = clamp(x, 0, iw - minSize);
    y = clamp(y, 0, ih - minSize);
    w = clamp(w, minSize, iw - x);
    h = clamp(h, minSize, ih - y);
    setRect({ x, y, w, h });
  };

  const onPointerUp = () => {
    dragRef.current.mode = null;
    dragRef.current.handle = null;
  };

  const doCrop = async () => {
    if (!file || !img) return;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(rect.w);
    canvas.height = Math.round(rect.h);
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(
      img,
      rect.x,
      rect.y,
      rect.w,
      rect.h,
      0,
      0,
      canvas.width,
      canvas.height
    );
    const isPng = file.type.includes('png');
    const blob: Blob = await new Promise((res) =>
      canvas.toBlob((b) => res(b!), isPng ? 'image/png' : 'image/jpeg', 0.92)
    );
    const url = URL.createObjectURL(blob);
    setResult(url);
    toast.success('Image cropped');
  };

  return (
    <ToolLayout tool={tool}>
      {!file ? (
        <Dropzone accept="image/*" onFiles={handleFile} hint="PNG, JPG, WebP" />
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <span
                className="max-w-[180px] truncate text-sm font-medium"
                title={file.name}
              >
                {file.name}
              </span>
              <Button variant="ghost" size="sm" onClick={reset}>
                <RotateCcw className="mr-1 h-4 w-4" /> Change
              </Button>
            </div>
            <div className="flex justify-center rounded-lg border bg-muted/30 p-2">
              <canvas
                ref={canvasRef}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                className="max-w-full touch-none cursor-crosshair"
              />
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Drag inside to move, drag handles to resize, drag outside to draw
              a new selection
            </p>
          </Card>

          <Card className="p-5">
            <div className="space-y-5">
              <div>
                <Label className="mb-2 block">Aspect ratio</Label>
                <div className="flex flex-wrap gap-2">
                  {aspectPresets.map((p) => (
                    <Button
                      key={p.label}
                      size="sm"
                      variant={aspect === p.value ? 'default' : 'outline'}
                      onClick={() => {
                        setAspect(p.value);
                        if (p.value && img) {
                          const newH = rect.w / p.value;
                          setRect({
                            ...rect,
                            h: Math.min(newH, img.naturalHeight - rect.y),
                          });
                        }
                      }}
                    >
                      {p.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="cx">X (px)</Label>
                  <Input
                    id="cx"
                    type="number"
                    value={Math.round(rect.x)}
                    onChange={(e) =>
                      setRect({ ...rect, x: Number(e.target.value) })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="cy">Y (px)</Label>
                  <Input
                    id="cy"
                    type="number"
                    value={Math.round(rect.y)}
                    onChange={(e) =>
                      setRect({ ...rect, y: Number(e.target.value) })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="cw">Width (px)</Label>
                  <Input
                    id="cw"
                    type="number"
                    value={Math.round(rect.w)}
                    onChange={(e) =>
                      setRect({ ...rect, w: Number(e.target.value) })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="ch">Height (px)</Label>
                  <Input
                    id="ch"
                    type="number"
                    value={Math.round(rect.h)}
                    onChange={(e) =>
                      setRect({ ...rect, h: Number(e.target.value) })
                    }
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={doCrop} className="flex-1">
                  Crop image
                </Button>
                {result && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      fetch(result)
                        .then((r) => r.blob())
                        .then((b) =>
                          downloadBlob(
                            b,
                            `${baseName(file.name)}-cropped.${file.name.split('.').pop()}`
                          )
                        )
                    }
                  >
                    <Download className="mr-1 h-4 w-4" /> Download
                  </Button>
                )}
              </div>

              {result && (
                <div className="overflow-hidden rounded-lg border bg-muted/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={result}
                    alt="result"
                    className="mx-auto max-h-60 object-contain"
                  />
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </ToolLayout>
  );
}
