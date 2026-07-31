'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { PDFDocument } from '@cantoo/pdf-lib';
import { Dropzone } from '@/components/dropzone';
import { ToolLayout } from '@/components/tool-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Download, RotateCcw, FileText } from 'lucide-react';
import { getTool } from '@/lib/tools';
import { downloadBlob, formatBytes } from '@/lib/file-utils';

const tool = getTool('compress-pdf-to-size')!;

async function renderPdfToBlob(
  data: ArrayBuffer,
  scale: number,
  jpegQuality: number
): Promise<Uint8Array> {
  const pdfjsLib = await import('pdfjs-dist/build/pdf.mjs');
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const out = await PDFDocument.create();
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(viewport.width));
    canvas.height = Math.max(1, Math.round(viewport.height));
    const ctx = canvas.getContext('2d')!;
    await page.render({ canvas, canvasContext: ctx, viewport }).promise;
    const dataUrl = canvas.toDataURL('image/jpeg', jpegQuality);
    const jpgBytes = await fetch(dataUrl).then((r) => r.arrayBuffer());
    const img = await out.embedJpg(jpgBytes);
    out.addPage([canvas.width, canvas.height]).drawImage(img, {
      x: 0,
      y: 0,
      width: canvas.width,
      height: canvas.height,
    });
  }
  return out.save();
}

export default function CompressPdfToSizePage() {
  const [file, setFile] = useState<File | null>(null);
  const [targetKb, setTargetKb] = useState(500);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ size: number; data: Uint8Array } | null>(
    null
  );

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
      const targetBytes = targetKb * 1024;
      const original = await file.arrayBuffer();
      let best: Uint8Array | null = null;

      const scales = [1.5, 1.0, 0.75, 0.5, 0.35, 0.25, 0.18, 0.12];
      for (const scale of scales) {
        const bytes = await renderPdfToBlob(original.slice(0), scale, 0.6);
        if (bytes.byteLength <= targetBytes) {
          best = bytes;
          break;
        }
        best = bytes;
      }

      if (!best) throw new Error('no result');
      setResult({ size: best.byteLength, data: best });
      const pct = Math.round((best.byteLength / file.size) * 100);
      toast.success(
        `Compressed to ${formatBytes(best.byteLength)} (${pct}% of original)`
      );
    } catch (e) {
      console.error(e);
      toast.error('Failed to compress PDF');
    } finally {
      setBusy(false);
    }
  };

  const saved = result ? file!.size - result.size : 0;

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
                    Saved: {formatBytes(Math.max(0, saved))}
                  </p>
                  <p
                    className={
                      result.size <= targetKb * 1024
                        ? 'font-medium text-emerald-600'
                        : 'font-medium text-amber-600'
                    }
                  >
                    {result.size <= targetKb * 1024
                      ? 'Target met'
                      : 'Closest possible — try a larger target'}
                  </p>
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
                  min={10}
                  onChange={(e) => setTargetKb(Number(e.target.value))}
                  className="mt-1"
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  The tool progressively lowers page resolution until the file
                  fits your target. Very small targets may reduce quality
                  significantly.
                </p>
              </div>

              <div className="flex gap-2">
                <Button onClick={doCompress} disabled={busy} className="flex-1">
                  {busy ? 'Compressing…' : 'Compress to target'}
                </Button>
                {result && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      downloadBlob(result.data, `compressed-${targetKb}kb.pdf`)
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
