import './globals.css';
import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Prompt2Visuals',
  description: 'Turn your prompt into stunning visuals from Freepik and AI.',
};

/**
 * Root layout for all pages. This component wraps the entire application and
 * ensures global styles are applied. You can add providers (like context
 * providers) here if needed.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-800">
        {children}
      </body>
    </html>
  );
}
