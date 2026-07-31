'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Tool } from '@/lib/tools';

interface ToolLayoutProps {
  tool: Tool;
  children: React.ReactNode;
}

export function ToolLayout({ tool, children }: ToolLayoutProps) {
  const Icon = tool.icon;
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link href="/">
          <ChevronLeft className="mr-1 h-4 w-4" /> All tools
        </Link>
      </Button>

      <div className="mb-8 flex items-start gap-4">
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent ${tool.color}`}
        >
          <Icon className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {tool.name}
          </h1>
          <p className="mt-1 text-muted-foreground">{tool.description}</p>
        </div>
      </div>

      {children}
    </div>
  );
}
