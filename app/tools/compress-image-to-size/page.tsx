'use client';

import { useState } from 'react';
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
  formatBytes,
  loadImage,
  baseName,
} from '@/lib/file-utils';

const tool = getTool('compress-image-to-size')!;

async function compressToTarget(
  img: HTMLImageElement,
  targetBytes: number,
  isPng: boolean
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d')!;
  if (!isPng) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(img, 0, 0);
  const mime = isPng ? 'image/png' : 'image/jpeg';

  const encode = (quality: number) =>
    new Promise<Blob>((res) =>
      canvas.toBlob((b) => res(b!), mime, quality)
    );

  let blob = await encode(isPng ? 1 : 0.92);
  if (blob.size <= targetBytes) return blob;

  if (isPng) {
    let scale = 0.95;
    while (scale > 0.05) {
      const c2 = document.createElement('canvas');
      c2.width = Math.max(1, Math.round(img.naturalWidth * scale));
      c2.height = Math.max(1, Math.round(img.naturalHeight * scale));
      const ctx2 = c2.getContext('2d')!;
      ctx2.drawImage(img, 0, 0, c2.width, c2.height);
      blob = await new Promise<Blob>((res) =>
        c2.toBlob((b) => res(b!), 'image/png')
      );
      if (blob.size <= targetBytes) return blob;
      scale -= 0.05;
    }
    return blob;
  }

  let lo = 0.05;
  let hi = 0.92;
  let best = blob;
  for (let i = 0; i < 12; i++) {
    const mid = (lo + hi) / 2;
    const candidate = await encode(mid);
    if (candidate.size <= targetBytes) {
      best = candidate;
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return best;
}

export default function CompressImageToSizePage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [targetKb, setTargetKb] = useState(100);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ url: string; size: number } | null>(
    null
  );

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

  const doCompress = async () => {
    if (!file) return;
    setBusy(true);
    setResult(null);
    try {
      const img = await loadImage(preview);
      const isPng = file.type.includes('png');
      const blob = await compressToTarget(img, targetKb * 1024, isPng);
      const url = URL.createObjectURL(blob);
      setResult({ url, size: blob.size });
      const pct = Math.round((blob.size / file.size) * 100);
      toast.success(`Compressed to ${formatBytes(blob.size)} (${pct}% of original)`);
    } catch {
      toast.error('Failed to compress image');
    } finally {
      setBusy(false);
    }
  };

  const saved = result ? file!.size - result.size : 0;

  return (
    <ToolLayout tool={tool}>
      {!file ? (
        <Dropzone accept="image/*" onFiles={handleFile} hint="JPG or PNG" />
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
              <span>Original: {formatBytes(file.size)}</span>
              {result && (
                <>
                  <span>Result: {formatBytes(result.size)}</span>
                  <span className="font-medium text-emerald-600">
                    Saved: {formatBytes(Math.max(0, saved))}
                  </span>
                  <span
                    className={
                      result.size <= targetKb * 1024
                        ? 'font-medium text-emerald-600'
                        : 'font-medium text-amber-600'
                    }
                  >
                    {result.size <= targetKb * 1024
                      ? 'Target met'
                      : 'Closest possible'}
                  </span>
                </>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <div className="space-y-6">
              <div>
                <Label htmlFor="target">Target size (KB)</Label>
                <Input
                  id="target"
                  type="number"
                  value={targetKb}
                  min={1}
                  onChange={(e) => setTargetKb(Number(e.target.value))}
                  className="mt-1"
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  The tool automatically adjusts quality (and resolution for
                  PNG) to get as close to your target as possible.
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={doCompress}
                  disabled={busy}
                  className="flex-1"
                >
                  {busy ? 'Compressing…' : 'Compress to target'}
                </Button>
                {result && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      fetch(result.url)
                        .then((r) => r.blob())
                        .then((b) =>
                          downloadBlob(
                            b,
                            `${baseName(file.name)}-${targetKb}kb.${file.name.split('.').pop()}`
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
