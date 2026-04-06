import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'NGSS Storyline Planner',
  description: 'Plan NGSS storyline units with your team',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b border-border px-6 py-3 flex items-center justify-between bg-surface">
          <a href="/" className="flex items-center gap-2">
            <span className="text-teal font-bold text-xl">NGSS Planner</span>
          </a>
          <a href="/settings" className="text-sm text-muted hover:text-foreground transition-colors">
            Settings
          </a>
        </header>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
