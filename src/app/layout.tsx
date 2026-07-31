import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';

const inter = Inter({ subsets: ['latin'] });

const themeScript = `(function(){try{var t=localStorage.getItem('theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==='dark'||(!t&&d))document.documentElement.classList.add('dark');}catch(e){}})();`;

export const metadata: Metadata = {
  title: 'AdiToolHub — Free Online Image & PDF Tools by Aditya',
  description:
    'A free all-in-one toolkit by Aditya to crop, resize, compress and convert images, and merge, compress, and create PDFs. Everything runs in your browser — your files never leave your device.',
  openGraph: {
    title: 'AdiToolHub — Free Online Image & PDF Tools by Aditya',
    description:
      'Crop, resize, compress and convert images. Merge, compress, and create PDFs. All in your browser.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
