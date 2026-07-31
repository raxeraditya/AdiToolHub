'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Dropzone } from '@/components/dropzone';
import { ToolLayout } from '@/components/tool-layout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Download, RotateCcw, FileText, Loader2 } from 'lucide-react';
import { getTool } from '@/lib/tools';
import { downloadBlob, baseName } from '@/lib/file-utils';

const tool = getTool('pdf-to-image')!;

type Format = 'png' | 'jpeg';

interface PageImage {
  url: string;
  blob: Blob;
  width: number;
  height: number;
}

export default function PdfToImagePage() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageImage[]>([]);
  const [busy, setBusy] = useState(false);
  const [scale, setScale] = useState(1.5);
  const [format, setFormat] = useState<Format>('png');

  const handleFile = async (files: File[]) => {
    const f = files[0];
    setFile(f);
    setPages([]);
    setBusy(true);
    try {
      const pdfjsLib = await import('pdfjs-dist/build/pdf.mjs');
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
      const data = await f.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data }).promise;
      const results: PageImage[] = [];
      const mime = format === 'png' ? 'image/png' : 'image/jpeg';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(viewport.width));
        canvas.height = Math.max(1, Math.round(viewport.height));
        const ctx = canvas.getContext('2d')!;
        if (format === 'jpeg') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        await page.render({ canvas, canvasContext: ctx, viewport }).promise;
        const blob: Blob = await new Promise((res) =>
          canvas.toBlob((b) => res(b!), mime, 0.92)
        );
        results.push({
          url: URL.createObjectURL(blob),
          blob,
          width: canvas.width,
          height: canvas.height,
        });
      }
      setPages(results);
      toast.success(`Extracted ${results.length} page${results.length > 1 ? 's' : ''}`);
    } catch (e) {
      console.error(e);
      toast.error('Failed to extract images');
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPages([]);
  };

  const downloadPage = (p: PageImage, index: number) => {
    const ext = format === 'png' ? 'png' : 'jpg';
    downloadBlob(p.blob, `${baseName(file!.name)}-page-${index + 1}.${ext}`);
  };

  return (
    <ToolLayout tool={tool}>
      {!file ? (
        <Dropzone accept="application/pdf" onFiles={handleFile} hint="Single PDF file" />
      ) : (
        <div className="space-y-6">
          <Card className="p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <FileText className="h-5 w-5" />
                </span>
                <span
                  className="max-w-[180px] truncate text-sm font-medium"
                  title={file.name}
                >
                  {file.name}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={reset}>
                <RotateCcw className="mr-1 h-4 w-4" /> Change
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <Label>Quality / zoom</Label>
                  <span className="text-sm font-medium">{scale.toFixed(1)}x</span>
                </div>
                <Slider
                  value={[scale]}
                  onValueChange={(v) => setScale(v[0])}
                  min={0.5}
                  max={3}
                  step={0.1}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Higher zoom = sharper, larger images.
                </p>
              </div>
              <div>
                <Label className="mb-2 block">Format</Label>
                <RadioGroup
                  value={format}
                  onValueChange={(v) => setFormat(v as Format)}
                  className="flex gap-4"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="png" id="fmt-png" />
                    <Label htmlFor="fmt-png">PNG</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="jpeg" id="fmt-jpg" />
                    <Label htmlFor="fmt-jpg">JPG</Label>
                  </div>
                </RadioGroup>
                <p className="mt-1 text-xs text-muted-foreground">
                  Change settings and re-upload to apply.
                </p>
              </div>
            </div>
          </Card>

          {busy && (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Extracting pages…
            </div>
          )}

          {!busy && pages.length > 0 && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {pages.map((p, i) => (
                <Card key={i} className="overflow-hidden p-0">
                  <div className="relative bg-muted/30">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.url}
                      alt={`Page ${i + 1}`}
                      className="mx-auto max-h-48 w-full object-contain"
                    />
                    <span className="absolute left-2 top-2 rounded bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
                      {i + 1}
                    </span>
                  </div>
                  <div className="p-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => downloadPage(p, i)}
                    >
                      <Download className="mr-1 h-4 w-4" /> Page {i + 1}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </ToolLayout>
  );
}
