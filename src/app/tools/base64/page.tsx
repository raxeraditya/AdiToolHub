'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Dropzone } from '@/components/dropzone';
import { ToolLayout } from '@/components/tool-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Check, Trash2, Download, Upload, ArrowLeftRight } from 'lucide-react';
import { getTool } from '@/lib/tools';
import { downloadBlob, baseName } from '@/lib/file-utils';

const tool = getTool('base64')!;

export default function Base64Page() {
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');

  const encodeText = () => {
    try {
      const encoded = btoa(unescape(encodeURIComponent(input)));
      setOutput(encoded);
      toast.success('Encoded to Base64');
    } catch {
      toast.error('Failed to encode text');
    }
  };

  const decodeText = () => {
    try {
      const decoded = decodeURIComponent(escape(atob(input.trim())));
      setOutput(decoded);
      toast.success('Decoded from Base64');
    } catch {
      toast.error('Invalid Base64 input');
    }
  };

  const handleImage = async (files: File[]) => {
    const f = files[0];
    setImageFile(f);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const b64 = result.split(',')[1] ?? '';
      setImagePreview(result);
      setOutput(b64);
      toast.success('Image converted to Base64');
    };
    reader.readAsDataURL(f);
  };

  const decodeToFile = () => {
    try {
      const byteString = atob(input.trim());
      const mimeMatch = input.trim().match(/^data:(.*?);base64,/);
      const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
      const clean = mimeMatch ? input.trim().split(',')[1] ?? '' : input.trim();
      const bytes = new Uint8Array(atob(clean).length);
      for (let i = 0; i < byteString.length; i++) bytes[i] = byteString.charCodeAt(i);
      const blob = new Blob([bytes], { type: mime });
      downloadBlob(blob, `decoded.${mime.split('/')[1] ?? 'bin'}`);
      toast.success('File downloaded');
    } catch {
      toast.error('Invalid Base64 — cannot decode to file');
    }
  };

  const copy = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    toast.success('Copied to clipboard');
  };

  const clear = () => {
    setInput('');
    setOutput('');
    setImageFile(null);
    setImagePreview('');
  };

  return (
    <ToolLayout tool={tool}>
      <div className="space-y-6">
        <Tabs value={mode} onValueChange={(v) => { setMode(v as 'encode' | 'decode'); clear(); }}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="encode">
              <ArrowLeftRight className="mr-1 h-4 w-4" /> Encode
            </TabsTrigger>
            <TabsTrigger value="decode">
              <ArrowLeftRight className="mr-1 h-4 w-4" /> Decode
            </TabsTrigger>
          </TabsList>

          <TabsContent value="encode" className="mt-4 space-y-4">
            <Card className="p-5">
              <Label className="mb-2 block">Text or image to encode</Label>
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type text to encode…"
                className="min-h-[120px] font-mono text-sm"
              />
              <div className="my-3 flex items-center gap-2 text-sm text-muted-foreground">
                <span className="flex-1 border-t" /> or <span className="flex-1 border-t" />
              </div>
              <Dropzone accept="image/*" onFiles={handleImage} hint="PNG, JPG, WebP" />
              {imagePreview && (
                <div className="mt-3 overflow-hidden rounded-lg border bg-muted/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="preview" className="mx-auto max-h-40 object-contain" />
                </div>
              )}
              <Button onClick={encodeText} disabled={!input} className="mt-4 w-full">
                <ArrowLeftRight className="mr-2 h-4 w-4" /> Encode text
              </Button>
            </Card>
          </TabsContent>

          <TabsContent value="decode" className="mt-4 space-y-4">
            <Card className="p-5">
              <Label className="mb-2 block">Base64 string to decode</Label>
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste a Base64 string…"
                className="min-h-[120px] font-mono text-sm"
              />
              <div className="mt-4 flex flex-wrap gap-3">
                <Button onClick={decodeText} disabled={!input}>
                  <ArrowLeftRight className="mr-2 h-4 w-4" /> Decode to text
                </Button>
                <Button variant="outline" onClick={decodeToFile} disabled={!input}>
                  <Download className="mr-2 h-4 w-4" /> Decode to file
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {output && (
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <Label>Output</Label>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={clear}>
                  <Trash2 className="mr-1 h-4 w-4" /> Clear
                </Button>
                <Button variant="ghost" size="sm" onClick={copy}>
                  {copied ? (
                    <Check className="mr-1 h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="mr-1 h-4 w-4" />
                  )}
                  Copy
                </Button>
              </div>
            </div>
            <pre className="max-h-72 overflow-auto rounded-lg border bg-muted/30 p-4 font-mono text-sm break-all whitespace-pre-wrap">
              {output}
            </pre>
          </Card>
        )}
      </div>
    </ToolLayout>
  );
}
