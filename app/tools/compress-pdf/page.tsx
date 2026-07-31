'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { PDFDocument } from '@cantoo/pdf-lib';
import { Dropzone } from '@/components/dropzone';
import { ToolLayout } from '@/components/tool-layout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { Download, RotateCcw, FileText } from 'lucide-react';
import { getTool } from '@/lib/tools';
import { downloadBlob, formatBytes } from '@/lib/file-utils';

const tool = getTool('compress-pdf')!;

export default function CompressPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [quality, setQuality] = useState(60);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ size: number } | null>(null);

  const handleFile = (files: File[]) => {
    setFile(files[0]);
    setResult(null);
  };

  const reset = () => {
    setFile(null);
    setResult(null);
  };

  const doCompress = async () => {
    if (!file) return;
    setBusy(true);
    setResult(null);
    try {
      const pdfjsLib = await import('pdfjs-dist/build/pdf.mjs');
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
      const data = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data }).promise;
      const out = await PDFDocument.create();

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: quality / 100 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d')!;
        await page.render({ canvas, canvasContext: ctx, viewport }).promise;
        const jpg = canvas.toDataURL('image/jpeg', 0.7);
        const jpgBytes = await fetch(jpg).then((r) => r.arrayBuffer());
        const img = await out.embedJpg(jpgBytes);
        const p = out.addPage([viewport.width, viewport.height]);
        p.drawImage(img, { x: 0, y: 0, width: viewport.width, height: viewport.height });
      }

      const bytes = await out.save();
      downloadBlob(bytes, 'compressed.pdf');
      setResult({ size: bytes.byteLength });
      toast.success('PDF compressed and downloaded');
    } catch (e) {
      console.error(e);
      toast.error('Failed to compress PDF');
    } finally {
      setBusy(false);
    }
  };

  const saved = result ? file!.size - result.size : 0;
  const savedPct = result ? Math.round((saved / file!.size) * 100) : 0;

  return (
    <ToolLayout tool={tool}>
      {!file ? (
        <Dropzone accept="application/pdf" onFiles={handleFile} hint="Single PDF file" />
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <FileText className="h-5 w-5" />
                </span>
                <span className="max-w-[180px] truncate text-sm font-medium" title={file.name}>{file.name}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={reset}>
                <RotateCcw className="mr-1 h-4 w-4" /> Change
              </Button>
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>Original size: {formatBytes(file.size)}</p>
              {result && (
                <>
                  <p>New size: {formatBytes(result.size)}</p>
                  <p className="font-medium text-emerald-600">
                    Saved: {formatBytes(Math.max(0, saved))} ({savedPct}%)
                  </p>
                </>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <div className="space-y-6">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <Label>Compression level</Label>
                  <span className="text-sm font-medium">{quality}%</span>
                </div>
                <Slider
                  value={[quality]}
                  onValueChange={(v) => setQuality(v[0])}
                  min={30}
                  max={100}
                  step={10}
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  Lower values give smaller files but lower quality. Pages are
                  rasterized to images.
                </p>
              </div>

              <Button
                onClick={doCompress}
                disabled={busy}
                className="w-full"
                size="lg"
              >
                {busy ? 'Compressing…' : 'Compress & download'}
                {!busy && <Download className="ml-2 h-4 w-4" />}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </ToolLayout>
  );
}
