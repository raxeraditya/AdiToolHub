'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { PDFDocument } from '@cantoo/pdf-lib';
import { Dropzone } from '@/components/dropzone';
import { ToolLayout } from '@/components/tool-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Download,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  Trash2,
  Image as ImageIcon,
} from 'lucide-react';
import { getTool } from '@/lib/tools';
import { downloadBlob, formatBytes, fileToDataURL, loadImage } from '@/lib/file-utils';

const tool = getTool('images-to-pdf')!;

interface ImgItem {
  id: string;
  file: File;
  url: string;
}

export default function ImagesToPdfPage() {
  const [items, setItems] = useState<ImgItem[]>([]);
  const [busy, setBusy] = useState(false);

  const addFiles = async (files: File[]) => {
    const imgs = files.filter((f) => f.type.startsWith('image/'));
    if (imgs.length < files.length) {
      toast.error('Some files were skipped — only images are allowed');
    }
    const newItems: ImgItem[] = [];
    for (const f of imgs) {
      newItems.push({ id: crypto.randomUUID(), file: f, url: await fileToDataURL(f) });
    }
    setItems((prev) => [...prev, ...newItems]);
  };

  const move = (id: string, dir: -1 | 1) =>
    setItems((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      if (idx < 0) return prev;
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });

  const remove = (id: string) =>
    setItems((prev) => prev.filter((p) => p.id !== id));

  const reset = () => setItems([]);

  const doConvert = async () => {
    if (items.length === 0) return;
    setBusy(true);
    try {
      const out = await PDFDocument.create();
      for (const item of items) {
        const img = await loadImage(item.url);
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        const isPng = item.file.type.includes('png');
        const embedded = isPng
          ? await out.embedPng(await fetch(canvas.toDataURL('image/png')).then((r) => r.arrayBuffer()))
          : await out.embedJpg(await fetch(canvas.toDataURL('image/jpeg', 0.92)).then((r) => r.arrayBuffer()));
        out.addPage([canvas.width, canvas.height]).drawImage(embedded, {
          x: 0,
          y: 0,
          width: canvas.width,
          height: canvas.height,
        });
      }
      const bytes = await out.save();
      downloadBlob(bytes, 'images.pdf');
      toast.success('PDF created and downloaded');
    } catch (e) {
      console.error(e);
      toast.error('Failed to create PDF');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolLayout tool={tool}>
      <Dropzone
        accept="image/*"
        multiple
        onFiles={addFiles}
        hint="Add JPG or PNG images — order matters"
      />

      {items.length > 0 && (
        <Card className="mt-6 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">
              {items.length} image{items.length !== 1 && 's'}
            </h3>
            <Button variant="ghost" size="sm" onClick={reset}>
              <RotateCcw className="mr-1 h-4 w-4" /> Clear
            </Button>
          </div>

          <ul className="grid gap-2 sm:grid-cols-2">
            {items.map((item, i) => (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-lg border p-2"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt={item.file.name}
                  className="h-12 w-12 rounded object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {i + 1}. {item.file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(item.file.size)}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => move(item.id, -1)}
                    disabled={i === 0}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => move(item.id, 1)}
                    disabled={i === items.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive"
                    onClick={() => remove(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>

          <Button
            onClick={doConvert}
            disabled={busy || items.length === 0}
            className="mt-5 w-full"
            size="lg"
          >
            {busy ? 'Creating PDF…' : 'Create PDF & download'}
            {!busy && <Download className="ml-2 h-4 w-4" />}
          </Button>
        </Card>
      )}
    </ToolLayout>
  );
}
