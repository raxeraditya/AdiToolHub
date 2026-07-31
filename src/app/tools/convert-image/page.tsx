'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Dropzone } from '@/components/dropzone';
import { ToolLayout } from '@/components/tool-layout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card } from '@/components/ui/card';
import { Download, RotateCcw } from 'lucide-react';
import { getTool } from '@/lib/tools';
import { downloadBlob, fileToDataURL, loadImage, baseName } from '@/lib/file-utils';

const tool = getTool('convert-image')!;

type Format = 'png' | 'jpeg' | 'webp' | 'gif' | 'bmp';

export default function ConvertImagePage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [format, setFormat] = useState<Format>('png');
  const [result, setResult] = useState<{ url: string; ext: string } | null>(
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

  const doConvert = async () => {
    if (!file) return;
    const img = await loadImage(preview);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d')!;
    if (format === 'jpeg' || format === 'webp' || format === 'bmp') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(img, 0, 0);
    const mime =
      format === 'png' ? 'image/png'
      : format === 'jpeg' ? 'image/jpeg'
      : format === 'webp' ? 'image/webp'
      : format === 'gif' ? 'image/gif'
      : 'image/bmp';
    const blob: Blob = await new Promise((res) =>
      canvas.toBlob((b) => res(b!), mime, 0.92)
    );
    const url = URL.createObjectURL(blob);
    const ext = format === 'jpeg' ? 'jpg' : format;
    setResult({ url, ext });
    toast.success(`Converted to ${ext.toUpperCase()}`);
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
                src={result?.url ?? preview}
                alt="preview"
                className="mx-auto max-h-72 object-contain"
              />
            </div>
          </Card>

          <Card className="p-5">
            <div className="space-y-6">
              <div>
                <Label className="mb-2 block">Convert to</Label>
                <RadioGroup
                  value={format}
                  onValueChange={(v) => setFormat(v as Format)}
                  className="flex gap-6"
                >
                  {(['png', 'jpeg', 'webp', 'gif', 'bmp'] as Format[]).map((f) => (
                    <div key={f} className="flex items-center gap-2">
                      <RadioGroupItem value={f} id={`f-${f}`} />
                      <Label htmlFor={`f-${f}`}>
                        {f === 'jpeg' ? 'JPG' : f.toUpperCase()}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                <p className="mt-2 text-xs text-muted-foreground">
                  JPG, WebP, GIF, and BMP flatten transparency to white. PNG
                  keeps transparency.
                </p>
              </div>

              <div className="flex gap-2">
                <Button onClick={doConvert} className="flex-1">
                  Convert
                </Button>
                {result && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      fetch(result.url)
                        .then((r) => r.blob())
                        .then((b) =>
                          downloadBlob(b, `${baseName(file.name)}.${result.ext}`)
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
