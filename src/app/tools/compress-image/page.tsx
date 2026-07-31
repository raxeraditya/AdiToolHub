'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Dropzone } from '@/components/dropzone';
import { ToolLayout } from '@/components/tool-layout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
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

const tool = getTool('compress-image')!;

export default function CompressImagePage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [quality, setQuality] = useState(70);
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
    const img = await loadImage(preview);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    const isPng = file.type.includes('png');
    const mime = isPng ? 'image/png' : 'image/jpeg';
    const blob: Blob = await new Promise((res) =>
      canvas.toBlob((b) => res(b!), mime, quality / 100)
    );
    const url = URL.createObjectURL(blob);
    setResult({ url, size: blob.size });
    toast.success('Image compressed');
  };

  const saved = result ? file!.size - result.size : 0;
  const savedPct = result ? Math.round((saved / file!.size) * 100) : 0;

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
                  <span>Compressed: {formatBytes(result.size)}</span>
                  <span className="font-medium text-emerald-600">
                    Saved: {formatBytes(Math.max(0, saved))} ({savedPct}%)
                  </span>
                </>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <div className="space-y-6">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <Label>Quality</Label>
                  <span className="text-sm font-medium">{quality}%</span>
                </div>
                <Slider
                  value={[quality]}
                  onValueChange={(v) => setQuality(v[0])}
                  min={10}
                  max={100}
                  step={5}
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  Lower quality = smaller file size. 70% is a good balance for
                  most photos.
                </p>
              </div>

              <div className="flex gap-2">
                <Button onClick={doCompress} className="flex-1">
                  Compress
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
                            `${baseName(file.name)}-compressed.${file.name.split('.').pop()}`
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
