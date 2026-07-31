'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Dropzone } from '@/components/dropzone';
import { ToolLayout } from '@/components/tool-layout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { Download, RotateCcw, Eraser } from 'lucide-react';
import { getTool } from '@/lib/tools';
import {
  downloadBlob,
  fileToDataURL,
  formatBytes,
  loadImage,
  baseName,
} from '@/lib/file-utils';

const tool = getTool('remove-background')!;

const colorPresets = [
  { label: 'Transparent', value: null as string | null },
  { label: 'White', value: '#ffffff' },
  { label: 'Blue', value: '#3b82f6' },
  { label: 'Green', value: '#22c55e' },
  { label: 'Red', value: '#ef4444' },
  { label: 'Black', value: '#000000' },
];

function hexToRgba(hex: string): [number, number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b, 255];
}

export default function RemoveBackgroundPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [tolerance, setTolerance] = useState(32);
  const [bgColor, setBgColor] = useState<string | null>(null);
  const [customColor, setCustomColor] = useState('#ffffff');
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleFile = async (files: File[]) => {
    const f = files[0];
    setFile(f);
    setResult(null);
    setPreview(await fileToDataURL(f));
  };

  const reset = () => {
    setFile(null);
    setPreview('');
    setResult(null);
  };

  const effectiveBg = bgColor === 'custom' ? customColor : bgColor;

  const doRemove = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const img = await loadImage(preview);
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // sample corner pixels as background reference
      const corners = [
        [0, 0],
        [canvas.width - 1, 0],
        [0, canvas.height - 1],
        [canvas.width - 1, canvas.height - 1],
      ];
      let bgR = 0,
        bgG = 0,
        bgB = 0;
      for (const [cx, cy] of corners) {
        const idx = (cy * canvas.width + cx) * 4;
        bgR += data[idx];
        bgG += data[idx + 1];
        bgB += data[idx + 2];
      }
      bgR /= 4;
      bgG /= 4;
      bgB /= 4;

      const tol = tolerance;
      const fill: [number, number, number, number] | null = effectiveBg
        ? hexToRgba(effectiveBg)
        : null;

      for (let i = 0; i < data.length; i += 4) {
        const dr = data[i] - bgR;
        const dg = data[i + 1] - bgG;
        const db = data[i + 2] - bgB;
        const dist = Math.sqrt(dr * dr + dg * dg + db * db);
        if (dist < tol) {
          if (fill) {
            data[i] = fill[0];
            data[i + 1] = fill[1];
            data[i + 2] = fill[2];
            data[i + 3] = 255;
          } else {
            data[i + 3] = 0;
          }
        }
      }
      ctx.putImageData(imageData, 0, 0);

      const usePng = effectiveBg === null || file.type.includes('png');
      const mime = usePng ? 'image/png' : 'image/jpeg';
      if (!usePng) {
        // flatten for jpeg
        const flat = document.createElement('canvas');
        flat.width = canvas.width;
        flat.height = canvas.height;
        const fctx = flat.getContext('2d')!;
        fctx.fillStyle = effectiveBg!;
        fctx.fillRect(0, 0, flat.width, flat.height);
        fctx.drawImage(canvas, 0, 0);
        const blob: Blob = await new Promise((res) =>
          flat.toBlob((b) => res(b!), mime, 0.92)
        );
        setResult(URL.createObjectURL(blob));
      } else {
        const blob: Blob = await new Promise((res) =>
          canvas.toBlob((b) => res(b!), mime)
        );
        setResult(URL.createObjectURL(blob));
      }
      toast.success('Background removed');
    } catch {
      toast.error('Failed to process image');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolLayout tool={tool}>
      {!file ? (
        <Dropzone accept="image/*" onFiles={handleFile} hint="PNG or JPG with a solid background" />
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
            <div
              className="overflow-hidden rounded-lg border bg-muted/30"
              style={
                result && effectiveBg === null
                  ? {
                      backgroundImage:
                        'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
                      backgroundSize: '16px 16px',
                      backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                    }
                  : undefined
              }
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={result ?? preview}
                alt="preview"
                className="mx-auto max-h-72 object-contain"
              />
            </div>
            {result && (
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Size: {formatBytes(file.size)} → processed
              </p>
            )}
          </Card>

          <Card className="p-5">
            <div className="space-y-6">
              <div>
                <Label className="mb-2 block">Background color</Label>
                <div className="flex flex-wrap gap-2">
                  {colorPresets.map((p) => (
                    <Button
                      key={p.label}
                      size="sm"
                      variant={bgColor === p.value ? 'default' : 'outline'}
                      onClick={() => setBgColor(p.value)}
                    >
                      {p.label}
                    </Button>
                  ))}
                  <Button
                    size="sm"
                    variant={bgColor === 'custom' ? 'default' : 'outline'}
                    onClick={() => setBgColor('custom')}
                  >
                    Custom
                  </Button>
                </div>
                {bgColor === 'custom' && (
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      type="color"
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                      className="h-9 w-12 cursor-pointer rounded border"
                    />
                    <span className="text-sm text-muted-foreground">
                      Pick any color
                    </span>
                  </div>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  Works best on images with a solid, uniform background color.
                </p>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <Label>Tolerance</Label>
                  <span className="text-sm font-medium">{tolerance}</span>
                </div>
                <Slider
                  value={[tolerance]}
                  onValueChange={(v) => setTolerance(v[0])}
                  min={5}
                  max={100}
                  step={1}
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  Higher tolerance removes more similar colors. Lower keeps more
                  of the subject intact.
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={doRemove}
                  disabled={busy}
                  className="flex-1"
                >
                  {busy ? 'Processing…' : 'Remove background'}
                  {!busy && <Eraser className="ml-2 h-4 w-4" />}
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
                            `${baseName(file.name)}-no-bg.${effectiveBg === null ? 'png' : file.name.split('.').pop()}`
                          )
                        )
                    }
                  >
                    <Download className="mr-1 h-4 w-4" /> Download
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}
    </ToolLayout>
  );
}
