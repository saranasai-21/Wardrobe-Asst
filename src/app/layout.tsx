import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'WardrobeLab | Tactical Fashion Studio & Personal Wardrobe Vault',
  description:
    'Production-grade browser-native fashion designer, full-body avatar fitting stage, and deterministic outfit curation engine.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#09090B] text-zinc-100 min-h-screen antialiased selection:bg-amber-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}
