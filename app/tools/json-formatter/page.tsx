'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { ToolLayout } from '@/components/tool-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Check, Minimize2, Code2, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { getTool } from '@/lib/tools';

const tool = getTool('json-formatter')!;

export default function JsonFormatterPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [indent, setIndent] = useState(2);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const validate = (text: string): { ok: boolean; error?: string; data?: unknown } => {
    if (!text.trim()) return { ok: false, error: 'Input is empty' };
    try {
      const data = JSON.parse(text);
      return { ok: true, data };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  };

  const format = () => {
    const res = validate(input);
    if (!res.ok || res.data === undefined) {
      setError(res.error ?? 'Invalid JSON');
      setOutput('');
      toast.error('Invalid JSON');
      return;
    }
    setError(null);
    setOutput(JSON.stringify(res.data, null, indent));
    toast.success('JSON formatted');
  };

  const minify = () => {
    const res = validate(input);
    if (!res.ok || res.data === undefined) {
      setError(res.error ?? 'Invalid JSON');
      setOutput('');
      toast.error('Invalid JSON');
      return;
    }
    setError(null);
    setOutput(JSON.stringify(res.data));
    toast.success('JSON minified');
  };

  const clear = () => {
    setInput('');
    setOutput('');
    setError(null);
  };

  const copy = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    toast.success('Copied to clipboard');
  };

  return (
    <ToolLayout tool={tool}>
      <div className="space-y-6">
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <Label>Input JSON</Label>
            <Button variant="ghost" size="sm" onClick={clear}>
              <Trash2 className="mr-1 h-4 w-4" /> Clear
            </Button>
          </div>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='{\n  "name": "AdiToolHub",\n  "version": 1\n}'
            className="min-h-[180px] font-mono text-sm"
          />

          {error && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="font-mono">{error}</span>
            </div>
          )}
          {!error && input.trim() && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Valid JSON</span>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3">
              <Label className="text-sm">Indent</Label>
              <Slider
                value={[indent]}
                onValueChange={(v) => setIndent(v[0])}
                min={2}
                max={8}
                step={2}
                className="w-28"
              />
              <span className="w-6 text-sm font-medium">{indent}</span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <Button onClick={format}>
              <Code2 className="mr-1 h-4 w-4" /> Format
            </Button>
            <Button variant="outline" onClick={minify}>
              <Minimize2 className="mr-1 h-4 w-4" /> Minify
            </Button>
          </div>
        </Card>

        {output && (
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <Label>Output</Label>
              <Button variant="ghost" size="sm" onClick={copy}>
                {copied ? (
                  <Check className="mr-1 h-4 w-4 text-emerald-500" />
                ) : (
                  <Copy className="mr-1 h-4 w-4" />
                )}
                Copy
              </Button>
            </div>
            <pre className="max-h-96 overflow-auto rounded-lg border bg-muted/30 p-4 font-mono text-sm">
              {output}
            </pre>
          </Card>
        )}
      </div>
    </ToolLayout>
  );
}
