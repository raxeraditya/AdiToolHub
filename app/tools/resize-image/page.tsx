'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Dropzone } from '@/components/dropzone';
import { ToolLayout } from '@/components/tool-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card } from '@/components/ui/card';
import { Download, RotateCcw } from 'lucide-react';
import { getTool } from '@/lib/tools';
import {
  downloadBlob,
  fileToDataURL,
  formatBytes,
  loadImage,
  baseName,
} from '@/lib/file-utils';

const tool = getTool('resize-image')!;

type Unit = 'px' | 'in' | 'cm';
const CM_PER_INCH = 2.54;

export default function ResizeImagePage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [origW, setOrigW] = useState(0);
  const [origH, setOrigH] = useState(0);
  const [unit, setUnit] = useState<Unit>('px');
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [dpi, setDpi] = useState(72);
  const [lockRatio, setLockRatio] = useState(true);
  const [result, setResult] = useState<{ url: string; size: number } | null>(
    null
  );

  const handleFile = async (files: File[]) => {
    const f = files[0];
    setFile(f);
    setResult(null);
    const url = await fileToDataURL(f);
    setPreview(url);
    const img = await loadImage(url);
    setOrigW(img.naturalWidth);
    setOrigH(img.naturalHeight);
    setWidth(img.naturalWidth);
    setHeight(img.naturalHeight);
  };

  const toPx = (val: number, u: Unit) =>
    u === 'px' ? val : Math.round((val / (u === 'in' ? 1 : CM_PER_INCH)) * dpi);

  const fromPx = (val: number, u: Unit) =>
    u === 'px' ? val : (val / dpi) * (u === 'in' ? 1 : CM_PER_INCH);

  const onWidth = (v: number) => {
    setWidth(v);
    if (lockRatio && origW) {
      const ratio = origH / origW;
      setHeight(parseFloat((v * ratio).toFixed(2)));
    }
  };

  const onHeight = (v: number) => {
    setHeight(v);
    if (lockRatio && origH) {
      const ratio = origW / origH;
      setWidth(parseFloat((v * ratio).toFixed(2)));
    }
  };

  const reset = () => {
    setFile(null);
    setPreview('');
    setResult(null);
    setWidth(0);
    setHeight(0);
  };

  const doResize = async () => {
    if (!file) return;
    const pxW = Math.max(1, toPx(width, unit));
    const pxH = Math.max(1, toPx(height, unit));
    const canvas = document.createElement('canvas');
    canvas.width = pxW;
    canvas.height = pxH;
    const ctx = canvas.getContext('2d')!;
    const img = await loadImage(preview);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, pxW, pxH);
    const isPng = file.type.includes('png');
    const mime = isPng ? 'image/png' : 'image/jpeg';
    const blob: Blob = await new Promise((res) =>
      canvas.toBlob((b) => res(b!), mime, 0.92)
    );
    const url = URL.createObjectURL(blob);
    setResult({ url, size: blob.size });
    toast.success('Image resized successfully');
  };

  return (
    <ToolLayout tool={tool}>
      {!file ? (
        <Dropzone
          accept="image/*"
          onFiles={handleFile}
          hint="PNG, JPG, WebP — up to your browser's limit"
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="max-w-[180px] truncate text-sm font-medium" title={file.name}>{file.name}</span>
              <Button variant="ghost" size="sm" onClick={reset}>
                <RotateCcw className="mr-1 h-4 w-4" /> Change
              </Button>
            </div>
            <div className="overflow-hidden rounded-lg border bg-muted/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={result?.url ?? preview}
                alt="preview"
                className="mx-auto max-h-72 object-contain"
              />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-muted-foreground">
              <span>Original: {origW} × {origH}px</span>
              <span>Size: {formatBytes(file.size)}</span>
              {result && (
                <>
                  <span>Output: {toPx(width, unit)} × {toPx(height, unit)}px</span>
                  <span>New size: {formatBytes(result.size)}</span>
                </>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <div className="space-y-5">
              <div>
                <Label className="mb-2 block">Unit</Label>
                <RadioGroup
                  value={unit}
                  onValueChange={(v) => setUnit(v as Unit)}
                  className="flex gap-4"
                >
                  {(['px', 'in', 'cm'] as Unit[]).map((u) => (
                    <div key={u} className="flex items-center gap-2">
                      <RadioGroupItem value={u} id={`u-${u}`} />
                      <Label htmlFor={`u-${u}`}>
                        {u === 'px' ? 'Pixels' : u === 'in' ? 'Inches' : 'Centimeters'}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {unit !== 'px' && (
                <div>
                  <Label htmlFor="dpi">DPI (resolution)</Label>
                  <Input
                    id="dpi"
                    type="number"
                    value={dpi}
                    min={1}
                    onChange={(e) => setDpi(Number(e.target.value))}
                    className="mt-1"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="w">Width ({unit})</Label>
                  <Input
                    id="w"
                    type="number"
                    value={width}
                    min={1}
                    onChange={(e) => onWidth(Number(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="h">Height ({unit})</Label>
                  <Input
                    id="h"
                    type="number"
                    value={height}
                    min={1}
                    onChange={(e) => onHeight(Number(e.target.value))}
                    className="mt-1"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={lockRatio}
                  onChange={(e) => setLockRatio(e.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
                Lock aspect ratio
              </label>

              <div className="flex gap-2">
                <Button onClick={doResize} className="flex-1">
                  Resize
                </Button>
                {result && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      fetch(result.url)
                        .then((r) => r.blob())
                        .then((b) =>
                          downloadBlob(b, `${baseName(file.name)}-resized.${file.name.split('.').pop()}`)
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
