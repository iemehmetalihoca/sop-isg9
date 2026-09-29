import type { Metadata } from 'next';
import '@/styles/globals.css';
import '@/styles/document.css';

export const metadata: Metadata = {
  title: 'LOTO SOP Management · React Editor V4',
  description: 'Inline A4 LOTO / SOP document editor',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
