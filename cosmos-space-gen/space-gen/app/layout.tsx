// app/layout.tsx
import type { Metadata } from 'next';
import { Orbitron, Barlow, Fira_Code } from 'next/font/google';
import './globals.css';

const orbitron = Orbitron({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const barlow   = Barlow({ subsets: ['latin'], weight: ['300','400','500','600'], variable: '--font-body', display: 'swap' });
const firaCode = Fira_Code({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

export const metadata: Metadata = {
  title: 'COSMOS — Space Image Generator',
  description: 'Generate stunning AI images of galaxies, nebulae, and celestial objects. Powered by Groq and Pollinations AI.',
  keywords: ['space', 'galaxy', 'nebula', 'AI image generator', 'cosmos', 'astronomy'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${orbitron.variable} ${barlow.variable} ${firaCode.variable}`}>
      <body>{children}</body>
    </html>
  );
}
