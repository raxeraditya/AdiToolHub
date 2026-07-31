# AdiToolHub — Free Online Image & PDF Tools by Aditya

A privacy-first, browser-based toolkit for everyday image and PDF tasks. Inspired by sites like pi7, AdiToolHub bundles the most-requested file utilities into a single, fast, ad-free Next.js app — **all processing happens locally in the browser, so files never leave the user's device.**

## Features

### Image tools
- **Resize Image** — Resize by **pixels, inches, or centimeters** with adjustable DPI and aspect-ratio lock.
- **Crop Image** — Interactive drag-to-crop with free or fixed aspect ratios (1:1, 4:3, 16:9, etc.) and exact pixel inputs.
- **Compress Image** — Reduce JPG/PNG file size with a quality slider and live before/after size comparison.
- **Compress Image to KB** — Compress an image to an **exact target file size** (e.g. 100 KB). Automatically adjusts quality and resolution to hit the target.
- **Convert Image** — Convert between **PNG, JPG, WebP, GIF, and BMP** with a single click.
- **Rotate Image** — Rotate images by 90°, 180°, or 270°.
- **Flip Image** — Mirror images horizontally or vertically.
- **Remove Background** — Remove or replace the background of an image with a color picker (white, blue, or any color).

### PDF tools
- **Merge PDF** — Combine multiple PDFs in your chosen order (reorder, remove, then merge).
- **Compress PDF** — Reduce PDF size by rasterizing pages at a lower resolution.
- **Compress PDF to KB** — Compress a PDF to an **exact target file size** (e.g. 500 KB). Progressively lowers page resolution until the target is met.
- **Images to PDF** — Turn a set of JPG/PNG images into a single PDF document.
- **PDF to Images** — Extract every page of a PDF as a PNG or JPG image, with adjustable quality.

### Why it's different
- **100% private** — No server uploads. All file processing runs in the browser via Canvas, `pdf-lib`, and `pdfjs-dist`.
- **No sign-up, no watermarks, no limits.**
- **Responsive & accessible** — Works on mobile and desktop with keyboard-friendly controls.
- **Clean, modern UI** built with Tailwind CSS and shadcn/ui.

## Tech stack
- **Next.js 13** (App Router) + **React 18**
- **TypeScript**
- **Tailwind CSS** + **shadcn/ui** components
- **pdf-lib** — client-side PDF creation and merging
- **pdfjs-dist** — client-side PDF rendering (for compression)
- **lucide-react** — icons

## Getting started

```bash
npm install
npm run dev
```

The app runs at `http://localhost:3000`.

### Build for production

```bash
npm run build
npm start
```

## Project structure

```
app/
  layout.tsx              # Root layout: header, footer, toaster
  page.tsx                # Homepage with hero + tool grid
  globals.css             # Theme tokens & Tailwind layers
  tools/
    resize-image/page.tsx
    crop-image/page.tsx
    compress-image/page.tsx
    compress-image-to-size/page.tsx
    convert-image/page.tsx
    rotate-image/page.tsx
    flip-image/page.tsx
    remove-background/page.tsx
    merge-pdf/page.tsx
    compress-pdf/page.tsx
    compress-pdf-to-size/page.tsx
    images-to-pdf/page.tsx
    pdf-to-image/page.tsx
components/
  site-header.tsx         # Sticky nav with mobile menu
  site-footer.tsx         # Footer with tool links
  dropzone.tsx            # Reusable drag-and-drop file input
  tool-layout.tsx         # Shared page shell for each tool
  ui/                     # shadcn/ui primitives
lib/
  tools.ts                # Tool registry (single source of truth)
  file-utils.ts           # Shared file/image helpers
```

## How the tool registry works

Every tool is declared once in `lib/tools.ts` with a slug, name, description, icon, and category. The homepage, header, and footer all read from this list, so adding a new tool is a two-step process:

1. Add an entry to the `tools` array in `lib/tools.ts`.
2. Create `app/tools/<slug>/page.tsx` with the tool's UI.

It then automatically appears on the homepage, navigation, and footer.

## How processing works (no backend)

- **Image tools** use the browser's `<canvas>` API to decode, transform, and re-encode images entirely in memory. Output is delivered via `Blob` + object URLs.
- **PDF merge / create** uses `pdf-lib` to assemble pages in the browser and trigger a download.
- **PDF compress** uses `pdfjs-dist` to render each page to a canvas at a reduced scale, then re-embeds those images in a new `pdf-lib` document.

Because nothing is uploaded, the app is safe to use on sensitive documents and works offline once loaded.

## Deployment

This template is configured for Netlify (`netlify.toml` included) and is also deployable to Vercel or any static/SSR host that supports Next.js.

```bash
# Netlify detects the config automatically
# For Vercel: import the repo and it just works
```

## Adding a new tool

1. **Register it** in `lib/tools.ts`:

```ts
{
  slug: 'rotate-image',
  name: 'Rotate Image',
  description: 'Rotate images by 90°, 180°, or 270°.',
  icon: RotateCw,
  category: 'image',
  color: 'text-sky-500',
}
```

2. **Create the page** at `app/tools/rotate-image/page.tsx`, using `ToolLayout` and `Dropzone` for a consistent look:

```tsx
'use client';
import { ToolLayout } from '@/components/tool-layout';
import { Dropzone } from '@/components/dropzone';
import { getTool } from '@/lib/tools';

const tool = getTool('rotate-image')!;

export default function RotateImagePage() {
  return (
    <ToolLayout tool={tool}>
      <Dropzone accept="image/*" onFiles={() => {}} />
      {/* ... */}
    </ToolLayout>
  );
}
```

That's it — the new tool shows up everywhere automatically.

## License

MIT — free to use, modify, and distribute.
