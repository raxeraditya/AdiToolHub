'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { PDFDocument } from '@cantoo/pdf-lib';
import { Dropzone } from '@/components/dropzone';
import { ToolLayout } from '@/components/tool-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, RotateCcw, FileText, Loader2, Plus, X } from 'lucide-react';
import { getTool } from '@/lib/tools';
import { downloadBlob, baseName } from '@/lib/file-utils';

const tool = getTool('split-pdf')!;

interface Range {
  id: string;
  value: string;
}

function parseRanges(input: string, max: number): number[] {
  const pages = new Set<number>();
  const tokens = input.split(',').map((t) => t.trim()).filter(Boolean);
  for (const tok of tokens) {
    if (/^\d+$/.test(tok)) {
      const n = parseInt(tok, 10);
      if (n >= 1 && n <= max) pages.add(n);
    } else {
      const m = tok.match(/^(\d+)\s*-\s*(\d+)$/);
      if (m) {
        let a = parseInt(m[1], 10);
        let b = parseInt(m[2], 10);
        if (a > b) [a, b] = [b, a];
        for (let i = a; i <= b; i++) if (i >= 1 && i <= max) pages.add(i);
      }
    }
  }
  return Array.from(pages).sort((a, b) => a - b);
}

export default function SplitPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [ranges, setRanges] = useState<Range[]>([{ id: crypto.randomUUID(), value: '1' }]);
  const [busy, setBusy] = useState(false);

  const handleFile = async (files: File[]) => {
    const f = files[0];
    setFile(f);
    try {
      const bytes = await f.arrayBuffer();
      const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const n = pdf.getPageCount();
      setNumPages(n);
      setRanges([{ id: crypto.randomUUID(), value: `1-${n}` }]);
    } catch {
      toast.error('Could not read PDF');
    }
  };

  const reset = () => {
    setFile(null);
    setNumPages(0);
    setRanges([{ id: crypto.randomUUID(), value: '1' }]);
  };

  const addRange = () =>
    setRanges((r) => [...r, { id: crypto.randomUUID(), value: '' }]);
  const removeRange = (id: string) =>
    setRanges((r) => (r.length === 1 ? r : r.filter((x) => x.id !== id)));
  const updateRange = (id: string, value: string) =>
    setRanges((r) => r.map((x) => (x.id === id ? { ...x, value } : x)));

  const doSplit = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const bytes = await file.arrayBuffer();
      const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const allPages = parseRanges(
        ranges.map((r) => r.value).join(','),
        numPages
      );
      if (allPages.length === 0) {
        toast.error('No valid pages selected');
        setBusy(false);
        return;
      }
      const out = await PDFDocument.create();
      const copied = await out.copyPages(
        src,
        allPages.map((p) => p - 1)
      );
      copied.forEach((p) => out.addPage(p));
      const result = await out.save();
      downloadBlob(result, `${baseName(file.name)}-split.pdf`);
      toast.success(`Exported ${allPages.length} page${allPages.length > 1 ? 's' : ''}`);
    } catch {
      toast.error('Failed to split PDF');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolLayout tool={tool}>
      {!file ? (
        <Dropzone accept="application/pdf" onFiles={handleFile} hint="Single PDF file" />
      ) : (
        <div className="space-y-6">
          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <FileText className="h-5 w-5" />
                </span>
                <span className="max-w-[180px] truncate text-sm font-medium" title={file.name}>
                  {file.name}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={reset}>
                <RotateCcw className="mr-1 h-4 w-4" /> Change
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              {numPages} page{numPages !== 1 && 's'} total. Enter page numbers
              (e.g. <code className="rounded bg-muted px-1">1</code>,{' '}
              <code className="rounded bg-muted px-1">3-5</code>,{' '}
              <code className="rounded bg-muted px-1">8</code>).
            </p>
          </Card>

          <Card className="p-5">
            <Label className="mb-3 block">Page ranges</Label>
            <div className="space-y-2">
              {ranges.map((r) => (
                <div key={r.id} className="flex items-center gap-2">
                  <Input
                    value={r.value}
                    onChange={(e) => updateRange(r.id, e.target.value)}
                    placeholder="e.g. 1-3, 7"
                    className="flex-1"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9 text-destructive"
                    onClick={() => removeRange(r.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="mt-3" onClick={addRange}>
              <Plus className="mr-1 h-4 w-4" /> Add range
            </Button>

            <Button
              onClick={doSplit}
              disabled={busy}
              className="mt-5 w-full"
              size="lg"
            >
              {busy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Splitting…
                </>
              ) : (
                <>
                  Split & download <Download className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </Card>
        </div>
      )}
    </ToolLayout>
  );
}
