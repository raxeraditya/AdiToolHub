import {
  Crop,
  Maximize2,
  FileArchive,
  FileImage,
  FilePlus2,
  FileStack,
  Images,
  Wand2,
  RotateCw,
  FlipHorizontal2,
  Target,
  Gauge,
  Eraser,
  Scissors,
  LayoutGrid,
  Lock,
  Braces,
  Binary,
  ShieldOff,
  type LucideIcon,
} from 'lucide-react';

export type ToolCategory = 'image' | 'pdf' | 'developer';

export interface Tool {
  slug: string;
  name: string;
  description: string;
  icon: LucideIcon;
  category: ToolCategory;
  color: string;
}

export const tools: Tool[] = [
  {
    slug: 'resize-image',
    name: 'Resize Image',
    description: 'Resize by pixel, inch, or centimeter with DPI control.',
    icon: Maximize2,
    category: 'image',
    color: 'text-sky-500',
  },
  {
    slug: 'crop-image',
    name: 'Crop Image',
    description: 'Crop images to exact dimensions or free aspect ratio.',
    icon: Crop,
    category: 'image',
    color: 'text-emerald-500',
  },
  {
    slug: 'compress-image',
    name: 'Compress Image',
    description: 'Reduce JPG and PNG file size with adjustable quality.',
    icon: Gauge,
    category: 'image',
    color: 'text-amber-500',
  },
  {
    slug: 'compress-image-to-size',
    name: 'Compress Image to KB',
    description: 'Compress an image to an exact target file size in KB.',
    icon: Target,
    category: 'image',
    color: 'text-red-500',
  },
  {
    slug: 'convert-image',
    name: 'Convert Image',
    description: 'Convert between PNG, JPG, and WebP formats instantly.',
    icon: FileImage,
    category: 'image',
    color: 'text-rose-500',
  },
  {
    slug: 'rotate-image',
    name: 'Rotate Image',
    description: 'Rotate images by 90, 180, or 270 degrees.',
    icon: RotateCw,
    category: 'image',
    color: 'text-teal-500',
  },
  {
    slug: 'flip-image',
    name: 'Flip Image',
    description: 'Flip or mirror images horizontally and vertically.',
    icon: FlipHorizontal2,
    category: 'image',
    color: 'text-cyan-500',
  },
  {
    slug: 'remove-background',
    name: 'Remove Background',
    description: 'Remove or replace image backgrounds with any color.',
    icon: Eraser,
    category: 'image',
    color: 'text-pink-500',
  },
  {
    slug: 'merge-pdf',
    name: 'Merge PDF',
    description: 'Combine multiple PDF files into one in your chosen order.',
    icon: FileStack,
    category: 'pdf',
    color: 'text-indigo-500',
  },
  {
    slug: 'split-pdf',
    name: 'Split PDF',
    description: 'Extract selected pages or page ranges into a new PDF.',
    icon: Scissors,
    category: 'pdf',
    color: 'text-blue-500',
  },
  {
    slug: 'organize-pdf',
    name: 'Organize PDF Pages',
    description: 'Drag, reorder, rotate, or delete pages before saving.',
    icon: LayoutGrid,
    category: 'pdf',
    color: 'text-violet-500',
  },
  {
    slug: 'protect-pdf',
    name: 'Protect & Unlock PDF',
    description: 'Add password protection or strip owner permissions.',
    icon: Lock,
    category: 'pdf',
    color: 'text-red-500',
  },
  {
    slug: 'compress-pdf',
    name: 'Compress PDF',
    description: 'Reduce PDF file size by rasterizing pages at lower DPI.',
    icon: FileArchive,
    category: 'pdf',
    color: 'text-orange-500',
  },
  {
    slug: 'compress-pdf-to-size',
    name: 'Compress PDF to KB',
    description: 'Compress a PDF to an exact target file size in KB.',
    icon: Target,
    category: 'pdf',
    color: 'text-red-500',
  },
  {
    slug: 'images-to-pdf',
    name: 'Images to PDF',
    description: 'Turn JPG and PNG images into a single PDF document.',
    icon: Images,
    category: 'pdf',
    color: 'text-purple-500',
  },
  {
    slug: 'pdf-to-image',
    name: 'PDF to Images',
    description: 'Extract every PDF page as a PNG or JPG image.',
    icon: FileImage,
    category: 'pdf',
    color: 'text-fuchsia-500',
  },
  {
    slug: 'json-formatter',
    name: 'JSON Formatter',
    description: 'Format, minify, and validate JSON with error highlighting.',
    icon: Braces,
    category: 'developer',
    color: 'text-amber-500',
  },
  {
    slug: 'base64',
    name: 'Base64 Encoder / Decoder',
    description: 'Convert text or images to Base64 and back, instantly.',
    icon: Binary,
    category: 'developer',
    color: 'text-emerald-500',
  },
  {
    slug: 'remove-exif',
    name: 'EXIF Data Remover',
    description: 'Strip metadata and location info from JPEG and PNG files.',
    icon: ShieldOff,
    category: 'developer',
    color: 'text-rose-500',
  },
];

export function getTool(slug: string): Tool | undefined {
  return tools.find((t) => t.slug === slug);
}

export const imageTools = tools.filter((t) => t.category === 'image');
export const pdfTools = tools.filter((t) => t.category === 'pdf');
export const developerTools = tools.filter((t) => t.category === 'developer');
