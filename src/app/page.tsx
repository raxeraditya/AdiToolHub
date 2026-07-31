import Link from 'next/link';
import { ShieldCheck, Zap, Lock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { tools, imageTools, pdfTools, developerTools } from '@/lib/tools';

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-accent/60 to-background" />
        <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <span className="inline-flex items-center gap-2 rounded-full border bg-background px-4 py-1.5 text-sm font-medium text-muted-foreground shadow-sm">
            <Lock className="h-4 w-4 text-primary" />
            100% private — files never leave your browser
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
            Every tool you need for{' '}
            <span className="text-primary">images & PDFs</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            Crop, resize, compress, and convert images. Merge, compress, and
            create PDFs. Built by Aditya — fast, free, and entirely in your
            browser — no uploads, no sign-up.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link href="#tools">
                Explore tools <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/tools/resize-image">Try Resize Image</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features strip */}
      <section className="border-b bg-secondary/30">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:grid-cols-3 sm:px-6">
          {[
            {
              icon: Lock,
              title: 'Private by design',
              text: 'Everything runs locally. Your files are never uploaded to a server.',
            },
            {
              icon: Zap,
              title: 'Instant & free',
              text: 'No waiting, no queues, no watermarks. Unlimited use, no sign-up.',
            },
            {
              icon: ShieldCheck,
              title: 'No quality loss',
              text: 'High-quality output with fine control over size and dimensions.',
            },
          ].map((f) => (
            <div key={f.title} className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tools grid */}
      <section id="tools" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold tracking-tight">All tools</h2>
          <p className="mt-2 text-muted-foreground">
            Pick a tool to get started — everything is free.
          </p>
        </div>

        <ToolGroup title="Image tools" tools={imageTools} />
        <div className="mt-12">
          <ToolGroup title="PDF tools" tools={pdfTools} />
        </div>
        <div className="mt-12">
          <ToolGroup title="Developer & text tools" tools={developerTools} />
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-secondary/30">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight">
            No installs. No accounts.
          </h2>
          <p className="mt-3 text-muted-foreground">
            AdiToolHub works on any device with a modern browser. Bookmark it
            and come back any time.
          </p>
          <Button asChild size="lg" className="mt-6">
            <Link href="#tools">Start using a tool</Link>
          </Button>
        </div>
      </section>
    </>
  );
}

function ToolGroup({
  title,
  tools,
}: {
  title: string;
  tools: typeof imageTools;
}) {
  return (
    <div>
      <h3 className="mb-4 text-lg font-semibold">{title}</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link key={tool.slug} href={`/tools/${tool.slug}`}>
              <Card className="group h-full p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-start gap-3">
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent ${tool.color}`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h4 className="font-semibold group-hover:text-primary">
                      {tool.name}
                    </h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {tool.description}
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
