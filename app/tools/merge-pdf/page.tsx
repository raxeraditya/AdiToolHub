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
  FileText,
} from 'lucide-react';
import { getTool } from '@/lib/tools';
import { downloadBlob, formatBytes } from '@/lib/file-utils';

const tool = getTool('merge-pdf')!;

interface PdfItem {
  id: string;
  file: File;
}

export default function MergePdfPage() {
  const [items, setItems] = useState<PdfItem[]>([]);
  const [busy, setBusy] = useState(false);

  const addFiles = (files: File[]) => {
    const pdfs = files.filter((f) => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
    if (pdfs.length < files.length) {
      toast.error('Some files were skipped — only PDFs are allowed');
    }
    setItems((prev) => [
      ...prev,
      ...pdfs.map((f) => ({ id: crypto.randomUUID(), file: f })),
    ]);
  };

  const move = (id: string, dir: -1 | 1) => {
    setItems((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      if (idx < 0) return prev;
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const remove = (id: string) =>
    setItems((prev) => prev.filter((p) => p.id !== id));

  const reset = () => setItems([]);

  const doMerge = async () => {
    if (items.length < 2) {
      toast.error('Add at least two PDFs to merge');
      return;
    }
    setBusy(true);
    try {
      const out = await PDFDocument.create();
      for (const item of items) {
        const bytes = await item.file.arrayBuffer();
        const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
        const pages = await out.copyPages(src, src.getPageIndices());
        pages.forEach((p) => out.addPage(p));
      }
      const merged = await out.save();
      downloadBlob(merged, 'merged.pdf');
      toast.success('PDF merged and downloaded');
    } catch (e) {
      toast.error('Failed to merge PDFs');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolLayout tool={tool}>
      <Dropzone
        accept="application/pdf"
        multiple
        onFiles={addFiles}
        hint="Add two or more PDF files"
      />

      {items.length > 0 && (
        <Card className="mt-6 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">
              {items.length} file{items.length !== 1 && 's'}
            </h3>
            <Button variant="ghost" size="sm" onClick={reset}>
              <RotateCcw className="mr-1 h-4 w-4" /> Clear
            </Button>
          </div>

          <ul className="space-y-2">
            {items.map((item, i) => (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <FileText className="h-5 w-5" />
                </span>
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
            onClick={doMerge}
            disabled={busy || items.length < 2}
            className="mt-5 w-full"
            size="lg"
          >
            {busy ? 'Merging…' : 'Merge & download'}
            {!busy && <Download className="ml-2 h-4 w-4" />}
          </Button>
        </Card>
      )}
    </ToolLayout>
  );
}
