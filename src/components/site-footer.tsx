import Link from 'next/link';
import { Wand2 } from 'lucide-react';
import { tools, developerTools } from '@/lib/tools';

export function SiteFooter() {
  return (
    <footer className="border-t bg-secondary/40">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 md:grid-cols-5">
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 font-bold">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Wand2 className="h-5 w-5" />
              </span>
              <span className="text-lg">AdiToolHub</span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground">
              Free, private, browser-based tools for images and PDFs by Aditya.
            </p>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold">Image Tools</h3>
            <ul className="space-y-2 text-sm">
              {tools
                .filter((t) => t.category === 'image')
                .map((tool) => (
                  <li key={tool.slug}>
                    <Link
                      href={`/tools/${tool.slug}`}
                      className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {tool.name}
                    </Link>
                  </li>
                ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold">PDF Tools</h3>
            <ul className="space-y-2 text-sm">
              {tools
                .filter((t) => t.category === 'pdf')
                .map((tool) => (
                  <li key={tool.slug}>
                    <Link
                      href={`/tools/${tool.slug}`}
                      className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {tool.name}
                    </Link>
                  </li>
                ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold">Developer Tools</h3>
            <ul className="space-y-2 text-sm">
              {developerTools.map((tool) => (
                <li key={tool.slug}>
                  <Link
                    href={`/tools/${tool.slug}`}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {tool.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold">About</h3>
            <p className="text-sm text-muted-foreground">
              All processing happens locally in your browser. No uploads, no
              servers, no tracking of your files.
            </p>
          </div>
        </div>

        <div className="mt-10 border-t pt-6 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} AdiToolHub. Built by Aditya.
        </div>
      </div>
    </footer>
  );
}
