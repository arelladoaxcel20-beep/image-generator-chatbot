// app/layout.tsx
import type { Metadata } from 'next';
import { Cinzel, DM_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const cinzel = Cinzel({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'VISIO — AI Image Generator',
  description: 'Create stunning AI images through natural conversation. Powered by Groq LLM and Pollinations AI.',
  keywords: ['AI image generator', 'text to image', 'Pollinations', 'Groq', 'chatbot'],
  openGraph: {
    title: 'VISIO — AI Image Generator',
    description: 'Create stunning AI images through natural conversation.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${cinzel.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-void text-pulse font-body antialiased">
        {children}
      </body>
    </html>
  );
}
