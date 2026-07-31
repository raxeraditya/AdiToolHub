'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Dropzone } from '@/components/dropzone';
import { ToolLayout } from '@/components/tool-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Download,
  RotateCcw,
  FlipHorizontal2,
  FlipVertical2,
} from 'lucide-react';
import { getTool } from '@/lib/tools';
import {
  downloadBlob,
  fileToDataURL,
  loadImage,
  baseName,
} from '@/lib/file-utils';

const tool = getTool('flip-image')!;

export default function FlipImagePage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [label, setLabel] = useState('');

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

  const doFlip = async (axis: 'h' | 'v') => {
    if (!file) return;
    const img = await loadImage(preview);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d')!;
    if (axis === 'h') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    } else {
      ctx.translate(0, canvas.height);
      ctx.scale(1, -1);
    }
    ctx.drawImage(img, 0, 0);
    const isPng = file.type.includes('png');
    const mime = isPng ? 'image/png' : 'image/jpeg';
    const blob: Blob = await new Promise((res) =>
      canvas.toBlob((b) => res(b!), mime, 0.92)
    );
    const url = URL.createObjectURL(blob);
    setResult(url);
    setLabel(axis === 'h' ? 'Flipped horizontally' : 'Flipped vertically');
    toast.success(label);
  };

  return (
    <ToolLayout tool={tool}>
      {!file ? (
        <Dropzone accept="image/*" onFiles={handleFile} hint="PNG, JPG, WebP" />
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
                src={result ?? preview}
                alt="preview"
                className="mx-auto max-h-72 object-contain"
              />
            </div>
            {result && (
              <p className="mt-2 text-center text-sm text-muted-foreground">
                {label}
              </p>
            )}
          </Card>

          <Card className="p-5">
            <div className="space-y-6">
              <div>
                <h3 className="mb-3 font-semibold">Flip direction</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={() => doFlip('h')}>
                    <FlipHorizontal2 className="mr-1 h-4 w-4" /> Horizontal
                  </Button>
                  <Button variant="outline" onClick={() => doFlip('v')}>
                    <FlipVertical2 className="mr-1 h-4 w-4" /> Vertical
                  </Button>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Horizontal flips left-to-right (mirror). Vertical flips
                  top-to-bottom.
                </p>
              </div>

              {result && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    fetch(result)
                      .then((r) => r.blob())
                      .then((b) =>
                        downloadBlob(
                          b,
                          `${baseName(file.name)}-flipped.${file.name.split('.').pop()}`
                        )
                      )
                  }
                >
                  <Download className="mr-1 h-4 w-4" /> Download
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}
    </ToolLayout>
  );
}
