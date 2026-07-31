'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Dropzone } from '@/components/dropzone';
import { ToolLayout } from '@/components/tool-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, RotateCcw, Trash2, ShieldCheck, Loader2 } from 'lucide-react';
import { getTool } from '@/lib/tools';
import { downloadBlob, fileToDataURL, loadImage, baseName, formatBytes } from '@/lib/file-utils';

const tool = getTool('remove-exif')!;

interface CleanedImage {
  url: string;
  blob: Blob;
  name: string;
  originalSize: number;
  newSize: number;
}

export default function RemoveExifPage() {
  const [items, setItems] = useState<CleanedImage[]>([]);
  const [busy, setBusy] = useState(false);

  const handleFiles = async (files: File[]) => {
    setBusy(true);
    const cleaned: CleanedImage[] = [];
    for (const f of files) {
      try {
        const dataUrl = await fileToDataURL(f);
        const img = await loadImage(dataUrl);
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        const isPng = f.type.includes('png') || f.name.toLowerCase().endsWith('.png');
        const mime = isPng ? 'image/png' : 'image/jpeg';
        const blob: Blob = await new Promise((res) =>
          canvas.toBlob((b) => res(b!), mime, 0.95)
        );
        cleaned.push({
          url: URL.createObjectURL(blob),
          blob,
          name: `${baseName(f.name)}-clean.${isPng ? 'png' : 'jpg'}`,
          originalSize: f.size,
          newSize: blob.size,
        });
      } catch {
        toast.error(`Failed to process ${f.name}`);
      }
    }
    setItems((prev) => [...prev, ...cleaned]);
    setBusy(false);
    if (cleaned.length > 0)
      toast.success(`Stripped metadata from ${cleaned.length} image${cleaned.length > 1 ? 's' : ''}`);
  };

  const remove = (i: number) =>
    setItems((prev) => {
      URL.revokeObjectURL(prev[i].url);
      return prev.filter((_, idx) => idx !== i);
    });

  const reset = () => {
    items.forEach((it) => URL.revokeObjectURL(it.url));
    setItems([]);
  };

  return (
    <ToolLayout tool={tool}>
      <Dropzone
        accept="image/png,image/jpeg"
        multiple
        onFiles={handleFiles}
        hint="JPG or PNG — metadata is stripped locally"
      />

      {busy && (
        <div className="mt-6 flex items-center justify-center py-8 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Processing images…
        </div>
      )}

      {items.length > 0 && (
        <Card className="mt-6 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-semibold">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              {items.length} cleaned image{items.length !== 1 && 's'}
            </h3>
            <Button variant="ghost" size="sm" onClick={reset}>
              <RotateCcw className="mr-1 h-4 w-4" /> Clear all
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((it, i) => (
              <div key={i} className="overflow-hidden rounded-lg border">
                <div className="relative bg-muted/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={it.url} alt={it.name} className="mx-auto max-h-40 w-full object-contain" />
                </div>
                <div className="p-3">
                  <p className="truncate text-sm font-medium" title={it.name}>{it.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatBytes(it.originalSize)} → {formatBytes(it.newSize)}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => downloadBlob(it.blob, it.name)}
                    >
                      <Download className="mr-1 h-4 w-4" /> Download
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive"
                      onClick={() => remove(i)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </ToolLayout>
  );
}
