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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, RotateCcw, FileText, Loader2, Lock, Unlock } from 'lucide-react';
import { getTool } from '@/lib/tools';
import { downloadBlob, baseName } from '@/lib/file-utils';

const tool = getTool('protect-pdf')!;

export default function ProtectPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<'protect' | 'unlock'>('protect');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const handleFile = (files: File[]) => setFile(files[0]);
  const reset = () => {
    setFile(null);
    setPassword('');
  };

  const doProcess = async () => {
    if (!file) return;
    if (mode === 'protect' && !password) {
      toast.error('Enter a password');
      return;
    }
    setBusy(true);
    try {
      const bytes = await file.arrayBuffer();
      const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const out = await PDFDocument.create();
      const pages = await out.copyPages(src, src.getPageIndices());
      pages.forEach((p) => out.addPage(p));

      if (mode === 'protect') {
        out.encrypt({
          userPassword: password,
          ownerPassword: password,
          permissions: {
            printing: 'highResolution',
            modifying: false,
            copying: false,
            annotating: false,
            fillingForms: true,
            contentAccessibility: true,
            documentAssembly: false,
          },
        });
        const result = await out.save();
        downloadBlob(result, `${baseName(file.name)}-protected.pdf`);
        toast.success('Password-protected PDF downloaded');
      } else {
        const result = await out.save();
        downloadBlob(result, `${baseName(file.name)}-unlocked.pdf`);
        toast.success('Permissions stripped — unlocked PDF downloaded');
      }
    } catch {
      toast.error(
        mode === 'protect'
          ? 'Failed to protect PDF'
          : 'Failed to unlock PDF'
      );
    } finally {
      setBusy(false);
    }
  };

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
                <span className="max-w-[180px] truncate text-sm font-medium" title={file.name}>
                  {file.name}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={reset}>
                <RotateCcw className="mr-1 h-4 w-4" /> Change
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              {mode === 'protect'
                ? 'Adds a user and owner password. Printing is allowed; editing and copying are blocked.'
                : 'Re-saves the PDF without owner-password restrictions. Works on PDFs you can already open.'}
            </p>
          </Card>

          <Card className="p-5">
            <Tabs value={mode} onValueChange={(v) => setMode(v as 'protect' | 'unlock')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="protect">
                  <Lock className="mr-1 h-4 w-4" /> Protect
                </TabsTrigger>
                <TabsTrigger value="unlock">
                  <Unlock className="mr-1 h-4 w-4" /> Unlock
                </TabsTrigger>
              </TabsList>

              <TabsContent value="protect" className="mt-4 space-y-4">
                <div>
                  <Label className="mb-2 block">Password</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter a password"
                  />
                </div>
              </TabsContent>

              <TabsContent value="unlock" className="mt-4">
                <p className="text-sm text-muted-foreground">
                  No password needed. The PDF will be re-saved without owner
                  permissions so you can edit, copy, and print freely.
                </p>
              </TabsContent>
            </Tabs>

            <Button
              onClick={doProcess}
              disabled={busy}
              className="mt-5 w-full"
              size="lg"
            >
              {busy ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : mode === 'protect' ? (
                <Lock className="mr-2 h-4 w-4" />
              ) : (
                <Unlock className="mr-2 h-4 w-4" />
              )}
              {busy
                ? 'Processing…'
                : mode === 'protect'
                ? 'Protect & download'
                : 'Unlock & download'}
            </Button>
          </Card>
        </div>
      )}
    </ToolLayout>
  );
}
