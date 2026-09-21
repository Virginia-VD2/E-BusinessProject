import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { Providers } from '@/components/providers/Providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'AYAMAJA | Asisten Belanja Ayam Segar Minahasa Utara',
  description: 'Kamu bilang butuh apa, AYAMAJA yang mengurus sisanya. Platform Asisten Belanja Cerdas Ayam Segar di Minahasa Utara.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={cn('font-sans', inter.variable)}>
      <body className="antialiased font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
