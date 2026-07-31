'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { PDFDocument, degrees } from '@cantoo/pdf-lib';
import { Dropzone } from '@/components/dropzone';
import { ToolLayout } from '@/components/tool-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, RotateCcw, FileText, Loader2, RotateCw, Trash2, GripVertical } from 'lucide-react';
import { getTool } from '@/lib/tools';
import { downloadBlob, baseName } from '@/lib/file-utils';

const tool = getTool('organize-pdf')!;

interface Thumb {
  id: string;
  url: string;
  pageIndex: number;
  rotation: 0 | 90 | 180 | 270;
}

export default function OrganizePdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [thumbs, setThumbs] = useState<Thumb[]>([]);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const handleFile = async (files: File[]) => {
    const f = files[0];
    setFile(f);
    setBusy(true);
    try {
      const pdfjsLib = await import('pdfjs-dist/build/pdf.mjs');
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
      const data = await f.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data }).promise;
      const out: Thumb[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.4 });
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(viewport.width));
        canvas.height = Math.max(1, Math.round(viewport.height));
        const ctx = canvas.getContext('2d')!;
        await page.render({ canvas, canvasContext: ctx, viewport }).promise;
        const blob: Blob = await new Promise((res) =>
          canvas.toBlob((b) => res(b!), 'image/png')
        );
        out.push({
          id: crypto.randomUUID(),
          url: URL.createObjectURL(blob),
          pageIndex: i - 1,
          rotation: 0,
        });
      }
      setThumbs(out);
      toast.success(`Loaded ${out.length} page${out.length > 1 ? 's' : ''}`);
    } catch {
      toast.error('Failed to load PDF');
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    thumbs.forEach((t) => URL.revokeObjectURL(t.url));
    setThumbs([]);
    setFile(null);
  };

  const rotate = (id: string) =>
    setThumbs((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, rotation: ((t.rotation + 90) % 360) as Thumb['rotation'] }
          : t
      )
    );

  const remove = (id: string) =>
    setThumbs((prev) => prev.filter((t) => t.id !== id));

  const onDragStart = (id: string) => setDragId(id);
  const onDragEnter = (id: string) => setOverId(id);
  const onDragEnd = useCallback(() => {
    if (!dragId || !overId || dragId === overId) {
      setDragId(null);
      setOverId(null);
      return;
    }
    setThumbs((prev) => {
      const from = prev.findIndex((t) => t.id === dragId);
      const to = prev.findIndex((t) => t.id === overId);
      if (from < 0 || to < 0) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setDragId(null);
    setOverId(null);
  }, [dragId, overId]);

  const doSave = async () => {
    if (!file || thumbs.length === 0) return;
    setSaving(true);
    try {
      const bytes = await file.arrayBuffer();
      const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const out = await PDFDocument.create();
      for (const t of thumbs) {
        const [copied] = await out.copyPages(src, [t.pageIndex]);
        const page = out.addPage(copied);
        if (t.rotation) page.setRotation(degrees(t.rotation));
      }
      const result = await out.save();
      downloadBlob(result, `${baseName(file.name)}-organized.pdf`);
      toast.success('Organized PDF downloaded');
    } catch {
      toast.error('Failed to save PDF');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ToolLayout tool={tool}>
      {!file ? (
        <Dropzone accept="application/pdf" onFiles={handleFile} hint="Single PDF file" />
      ) : (
        <div className="space-y-6">
          <Card className="p-4">
            <div className="flex items-center justify-between">
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
            <p className="mt-2 text-sm text-muted-foreground">
              Drag thumbnails to reorder. Use the rotate and delete buttons per
              page.
            </p>
          </Card>

          {busy && (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading pages…
            </div>
          )}

          {!busy && thumbs.length > 0 && (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {thumbs.map((t, i) => (
                  <Card
                    key={t.id}
                    draggable
                    onDragStart={() => onDragStart(t.id)}
                    onDragEnter={() => onDragEnter(t.id)}
                    onDragEnd={onDragEnd}
                    onDragOver={(e) => e.preventDefault()}
                    className={`group relative cursor-grab overflow-hidden p-0 transition-all active:cursor-grabbing ${
                      overId === t.id && dragId !== t.id
                        ? 'ring-2 ring-primary'
                        : ''
                    } ${dragId === t.id ? 'opacity-40' : ''}`}
                  >
                    <div className="flex items-center justify-between bg-muted/50 px-2 py-1">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-medium">{i + 1}</span>
                    </div>
                    <div className="relative bg-muted/30">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={t.url}
                        alt={`Page ${i + 1}`}
                        className="mx-auto max-h-40 w-full object-contain"
                        style={{ transform: `rotate(${t.rotation}deg)` }}
                      />
                    </div>
                    <div className="flex items-center justify-center gap-1 border-t p-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => rotate(t.id)}
                      >
                        <RotateCw className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive"
                        onClick={() => remove(t.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>

              <Button
                onClick={doSave}
                disabled={saving || thumbs.length === 0}
                className="w-full"
                size="lg"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
                  </>
                ) : (
                  <>
                    Save & download <Download className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </>
          )}

          {!busy && thumbs.length === 0 && (
            <p className="text-center text-sm text-muted-foreground">
              No pages to organize.
            </p>
          )}
        </div>
      )}
    </ToolLayout>
  );
}
