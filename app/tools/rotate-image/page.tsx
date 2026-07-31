'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Dropzone } from '@/components/dropzone';
import { ToolLayout } from '@/components/tool-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, RotateCcw, RotateCw } from 'lucide-react';
import { getTool } from '@/lib/tools';
import {
  downloadBlob,
  fileToDataURL,
  loadImage,
  baseName,
} from '@/lib/file-utils';

const tool = getTool('rotate-image')!;

export default function RotateImagePage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [angle, setAngle] = useState(0);
  const [result, setResult] = useState<string | null>(null);

  const handleFile = async (files: File[]) => {
    const f = files[0];
    setFile(f);
    setResult(null);
    setAngle(0);
    setPreview(await fileToDataURL(f));
  };

  const reset = () => {
    setFile(null);
    setPreview('');
    setAngle(0);
    setResult(null);
  };

  const doRotate = async (deg: number) => {
    if (!file) return;
    const img = await loadImage(preview);
    const canvas = document.createElement('canvas');
    const rad = (deg * Math.PI) / 180;
    const abs = Math.abs(deg);
    if (abs === 90 || abs === 270) {
      canvas.width = img.naturalHeight;
      canvas.height = img.naturalWidth;
    } else {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
    }
    const ctx = canvas.getContext('2d')!;
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(rad);
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    const isPng = file.type.includes('png');
    const mime = isPng ? 'image/png' : 'image/jpeg';
    const blob: Blob = await new Promise((res) =>
      canvas.toBlob((b) => res(b!), mime, 0.92)
    );
    const url = URL.createObjectURL(blob);
    setResult(url);
    setAngle(deg);
    toast.success(`Rotated ${deg}°`);
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
                Rotated {angle}°
              </p>
            )}
          </Card>

          <Card className="p-5">
            <div className="space-y-6">
              <div>
                <h3 className="mb-3 font-semibold">Choose rotation</h3>
                <div className="grid grid-cols-3 gap-2">
                  <Button variant="outline" onClick={() => doRotate(90)}>
                    <RotateCw className="mr-1 h-4 w-4" /> 90°
                  </Button>
                  <Button variant="outline" onClick={() => doRotate(180)}>
                    <RotateCw className="mr-1 h-4 w-4" /> 180°
                  </Button>
                  <Button variant="outline" onClick={() => doRotate(270)}>
                    <RotateCw className="mr-1 h-4 w-4" /> 270°
                  </Button>
                </div>
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
                          `${baseName(file.name)}-rotated.${file.name.split('.').pop()}`
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
